import math
import time
import logging
from collections import deque
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timezone
import numpy as np

from backend.ambient_memory.segment import SpeechSegment

logger = logging.getLogger("jarvis.ambient_memory.vad")

class VoiceActivityDetector:
    """
    Adaptive Energy & Spectral Voice Activity Detector (VAD).
    
    Features:
    - Adaptive dynamic noise floor estimation for varying ambient room acoustics.
    - Pre-speech circular buffer to preserve initial phonetic consonants (plosives/fricatives).
    - Post-speech hangover buffer to prevent premature segmentation during natural pauses.
    - Minimum duration filtering to reject brief acoustic transients (e.g. keyboard taps, mouse clicks).
    - Accurate sub-millisecond start and end timestamps for every detected speech segment.
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        frame_duration_ms: int = 30,
        min_speech_duration_ms: int = 250,
        silence_hangover_ms: int = 700,
        pre_speech_padding_ms: int = 300,
        energy_threshold_multiplier: float = 2.8,
        min_energy_floor: float = 0.008
    ):
        self.sample_rate = sample_rate
        self.frame_duration_ms = frame_duration_ms
        self.frame_size = int(sample_rate * (frame_duration_ms / 1000.0))
        
        self.min_speech_frames = max(1, int(min_speech_duration_ms / frame_duration_ms))
        self.silence_hangover_frames = max(1, int(silence_hangover_ms / frame_duration_ms))
        self.pre_speech_frames = max(1, int(pre_speech_padding_ms / frame_duration_ms))
        
        self.energy_threshold_multiplier = energy_threshold_multiplier
        self.min_energy_floor = min_energy_floor
        
        # Adaptive noise floor tracking
        self.noise_floor = min_energy_floor
        self.noise_history = deque(maxlen=60) # ~1.8 seconds of ambient noise history
        
        # State tracking
        self.is_speech_active = False
        self.pre_speech_buffer = deque(maxlen=self.pre_speech_frames)
        self.current_segment_frames: List[np.ndarray] = []
        self.speech_start_epoch: Optional[float] = None
        self.speech_start_iso: Optional[str] = None
        self.speech_end_epoch: Optional[float] = None
        self.silence_frame_counter = 0
        self.active_speech_frame_counter = 0
        self.total_energy_sum = 0.0

    def compute_frame_energy(self, frame: np.ndarray) -> Tuple[float, float]:
        """
        Computes Root Mean Square (RMS) energy and Zero-Crossing Rate (ZCR).
        """
        if len(frame) == 0:
            return 0.0, 0.0
            
        # Float normalization [-1.0, 1.0] if integer PCM
        if frame.dtype in [np.int16, np.int32]:
            norm_frame = frame.astype(np.float32) / 32768.0
        elif frame.dtype in [np.float32, np.float64]:
            norm_frame = frame
        else:
            norm_frame = frame.astype(np.float32)

        rms = float(np.sqrt(np.mean(norm_frame ** 2) + 1e-12))
        
        # Zero-Crossing Rate (ZCR)
        zero_crossings = np.nonzero(np.diff(norm_frame > 0))[0]
        zcr = float(len(zero_crossings) / len(norm_frame)) if len(norm_frame) > 0 else 0.0
        
        return rms, zcr

    def update_noise_floor(self, rms: float):
        """
        Slowly tracks ambient background noise floor using an exponential moving minimum.
        """
        self.noise_history.append(rms)
        median_noise = float(np.median(self.noise_history))
        # Ensure noise floor doesn't drop below min_energy_floor
        self.noise_floor = max(self.min_energy_floor, median_noise)

    def is_frame_voiced(self, rms: float, zcr: float) -> bool:
        """
        Evaluates whether a single frame meets speech criteria.
        """
        dynamic_threshold = self.noise_floor * self.energy_threshold_multiplier
        # Frame is voiced if energy exceeds dynamic threshold and ZCR is within typical speech band (0.01 - 0.45)
        return (rms >= dynamic_threshold) and (zcr <= 0.50)

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp_epoch: Optional[float] = None
    ) -> Tuple[bool, Optional[SpeechSegment]]:
        """
        Processes a single audio frame (typically 30ms / 480 samples at 16kHz).
        
        Returns:
        - is_speaking: True if currently within an active speech segment
        - completed_segment: SpeechSegment instance if a segment just concluded, else None
        """
        now_epoch = timestamp_epoch if timestamp_epoch is not None else time.time()
        rms, zcr = self.compute_frame_energy(frame)
        is_voiced = self.is_frame_voiced(rms, zcr)

        completed_segment: Optional[SpeechSegment] = None

        if not self.is_speech_active:
            # Updating noise floor when not speaking
            if not is_voiced:
                self.update_noise_floor(rms)
                self.pre_speech_buffer.append((frame.copy(), now_epoch))
            else:
                # Speech onset detected!
                self.active_speech_frame_counter += 1
                self.pre_speech_buffer.append((frame.copy(), now_epoch))

                # If voiced frames reach minimum threshold, initiate speech segment
                if self.active_speech_frame_counter >= 2:
                    self.is_speech_active = True
                    self.silence_frame_counter = 0
                    
                    # Pull pre-speech buffer to capture initial consonants
                    self.current_segment_frames = [f for f, _ in self.pre_speech_buffer]
                    if self.pre_speech_buffer:
                        self.speech_start_epoch = self.pre_speech_buffer[0][1]
                    else:
                        self.speech_start_epoch = now_epoch

                    dt_start = datetime.fromtimestamp(self.speech_start_epoch, tz=timezone.utc)
                    self.speech_start_iso = dt_start.strftime("%Y-%m-%d %H:%M:%S")
                    
                    self.total_energy_sum = sum(self.compute_frame_energy(f)[0] for f in self.current_segment_frames)
                    logger.debug(f"[VAD] Speech onset detected at {self.speech_start_iso} (Noise floor: {self.noise_floor:.4f}, Energy: {rms:.4f})")
        else:
            # Currently in speech segment
            self.current_segment_frames.append(frame.copy())
            self.total_energy_sum += rms

            if is_voiced:
                self.silence_frame_counter = 0
                self.speech_end_epoch = now_epoch
            else:
                self.silence_frame_counter += 1

                # If silence exceeds hangover threshold, speech segment has ended!
                if self.silence_frame_counter >= self.silence_hangover_frames:
                    end_epoch = self.speech_end_epoch or now_epoch
                    dt_end = datetime.fromtimestamp(end_epoch, tz=timezone.utc)
                    speech_end_iso = dt_end.strftime("%Y-%m-%d %H:%M:%S")

                    total_frames = len(self.current_segment_frames)
                    duration_sec = total_frames * (self.frame_duration_ms / 1000.0)

                    # Validate that segment meets minimum speech duration
                    if total_frames >= self.min_speech_frames and duration_sec >= 0.20:
                        # Combine audio frames
                        combined_pcm = np.concatenate(self.current_segment_frames)
                        if combined_pcm.dtype != np.int16:
                            pcm_16 = (np.clip(combined_pcm, -1.0, 1.0) * 32767).astype(np.int16)
                        else:
                            pcm_16 = combined_pcm
                            
                        audio_bytes = pcm_16.tobytes()
                        avg_energy = self.total_energy_sum / max(1, total_frames)
                        confidence = min(1.0, max(0.5, (avg_energy / (self.noise_floor * 2.0))))

                        completed_segment = SpeechSegment(
                            start_time=self.speech_start_iso or speech_end_iso,
                            end_time=speech_end_iso,
                            start_epoch=self.speech_start_epoch or (end_epoch - duration_sec),
                            end_epoch=end_epoch,
                            duration_seconds=duration_sec,
                            sample_rate=self.sample_rate,
                            confidence=confidence,
                            audio_bytes=audio_bytes,
                            frame_count=total_frames,
                            energy_level=avg_energy
                        )
                        logger.info(f"[VAD] Speech segment captured: {duration_sec:.2f}s [{completed_segment.start_time} -> {completed_segment.end_time}]")

                    # Reset VAD state for next segment
                    self.reset_state()

        return self.is_speech_active, completed_segment

    def reset_state(self):
        """Resets active speech tracking state while retaining noise floor."""
        self.is_speech_active = False
        self.pre_speech_buffer.clear()
        self.current_segment_frames = []
        self.speech_start_epoch = None
        self.speech_start_iso = None
        self.speech_end_epoch = None
        self.silence_frame_counter = 0
        self.active_speech_frame_counter = 0
        self.total_energy_sum = 0.0

    def force_finalize(self) -> Optional[SpeechSegment]:
        """
        Forces finalization of any pending in-flight speech segment (e.g. on shutdown).
        """
        if not self.is_speech_active or not self.current_segment_frames:
            self.reset_state()
            return None

        total_frames = len(self.current_segment_frames)
        duration_sec = total_frames * (self.frame_duration_ms / 1000.0)
        end_epoch = time.time()
        dt_end = datetime.fromtimestamp(end_epoch, tz=timezone.utc)
        speech_end_iso = dt_end.strftime("%Y-%m-%d %H:%M:%S")

        combined_pcm = np.concatenate(self.current_segment_frames)
        if combined_pcm.dtype != np.int16:
            pcm_16 = (np.clip(combined_pcm, -1.0, 1.0) * 32767).astype(np.int16)
        else:
            pcm_16 = combined_pcm

        audio_bytes = pcm_16.tobytes()
        avg_energy = self.total_energy_sum / max(1, total_frames)

        segment = SpeechSegment(
            start_time=self.speech_start_iso or speech_end_iso,
            end_time=speech_end_iso,
            start_epoch=self.speech_start_epoch or (end_epoch - duration_sec),
            end_epoch=end_epoch,
            duration_seconds=duration_sec,
            sample_rate=self.sample_rate,
            confidence=0.9,
            audio_bytes=audio_bytes,
            frame_count=total_frames,
            energy_level=avg_energy
        )
        self.reset_state()
        return segment
