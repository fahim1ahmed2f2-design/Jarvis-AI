import time
import queue
import logging
import threading
from typing import Optional, Callable, List, Dict, Any, Tuple
from collections import deque
import numpy as np

try:
    import sounddevice as sd
    HAS_SOUNDDEVICE = True
except Exception as e:
    HAS_SOUNDDEVICE = False
    sd = None

from backend.ambient_memory.config import ambient_config
from backend.ambient_memory.vad import VoiceActivityDetector
from backend.ambient_memory.segment import SpeechSegment

logger = logging.getLogger("jarvis.ambient_memory.listener")

class AmbientMicListener:
    """
    Asynchronous, non-blocking Background Microphone Listener & Voice Activity Detection (VAD) Service.
    
    Features:
    - Captures 16kHz mono audio via PortAudio / sounddevice stream.
    - Graceful permission & missing hardware handling (no crash on headless/restricted environments).
    - Feeds audio frames to VoiceActivityDetector in real-time.
    - Internal ON/OFF control with zero background overhead when disabled.
    - Thread-safe ring buffer storing recent detected speech segments and timestamps.
    """

    def __init__(self):
        self.sample_rate = 16000
        self.frame_duration_ms = 30
        self.blocksize = int(self.sample_rate * (self.frame_duration_ms / 1000.0)) # 480 samples

        self.vad = VoiceActivityDetector(
            sample_rate=self.sample_rate,
            frame_duration_ms=self.frame_duration_ms,
            min_speech_duration_ms=250,
            silence_hangover_ms=700,
            pre_speech_padding_ms=300
        )

        self._is_running = False
        self._thread: Optional[threading.Thread] = None
        self._stream = None
        self._stop_event = threading.Event()
        self._audio_queue: queue.Queue = queue.Queue(maxsize=200)
        
        # Callbacks & recent segment memory buffer
        self._segment_callbacks: List[Callable[[SpeechSegment], None]] = []
        self._recent_segments = deque(maxlen=50) # In-memory buffer of latest 50 segments
        
        # Telemetry & status metrics
        self.status = "STOPPED" # STOPPED, LISTENING, ERROR, NO_MIC
        self.last_error: Optional[str] = None
        self.segments_detected_count = 0
        self.last_segment_timestamp: Optional[str] = None
        self.active_device_name: Optional[str] = None

    def is_running(self) -> bool:
        """Returns True if the listener thread and audio stream are actively listening."""
        return self._is_running and self.status == "LISTENING"

    def is_speech_active(self) -> bool:
        """Returns True if user voice activity is currently in progress."""
        return self.vad.is_speech_active

    def add_segment_callback(self, callback: Callable[[SpeechSegment], None]):
        """Registers a callback function to be triggered when a speech segment is finalized."""
        if callback not in self._segment_callbacks:
            self._segment_callbacks.append(callback)

    def remove_segment_callback(self, callback: Callable[[SpeechSegment], None]):
        """Removes a registered segment callback."""
        if callback in self._segment_callbacks:
            self._segment_callbacks.remove(callback)

    def check_microphone_availability(self) -> Tuple[bool, str, Optional[int]]:
        """
        Verifies microphone driver and input device availability without starting stream.
        """
        if not HAS_SOUNDDEVICE or sd is None:
            return False, "sounddevice library is not available in environment", None

        sound_dev = sd
        try:
            devices = sound_dev.query_devices()
            default_input = sound_dev.default.device[0]
            
            # Find a valid input device
            input_device_id = None
            input_device_name = "Default Microphone"

            if default_input is not None and default_input >= 0:
                dev_info = sound_dev.query_devices(default_input)
                if dev_info.get("max_input_channels", 0) > 0:
                    input_device_id = default_input
                    input_device_name = dev_info.get("name", "Default Mic")

            if input_device_id is None:
                # Search for any valid input device
                for idx, dev in enumerate(devices):
                    if dev.get("max_input_channels", 0) > 0:
                        input_device_id = idx
                        input_device_name = dev.get("name", f"Device #{idx}")
                        break

            if input_device_id is None:
                return False, "No audio input/microphone devices found on system.", None

            return True, input_device_name, input_device_id
        except Exception as e:
            return False, f"Microphone device query failed: {e}", None

    def start(self) -> bool:
        """
        Starts the ambient microphone capture stream and VAD worker asynchronously.
        """
        if self._is_running:
            logger.debug("[AMBIENT_LISTENER] Listener is already running.")
            return True

        avail, dev_name, dev_id = self.check_microphone_availability()
        if not avail:
            self.status = "NO_MIC"
            self.last_error = dev_name
            logger.warning(f"[AMBIENT_LISTENER] Cannot start: {dev_name}")
            return False

        self.active_device_name = dev_name
        self.last_error = None
        self._stop_event.clear()
        self._is_running = True
        self.status = "STARTING"

        # Start audio worker thread
        self._thread = threading.Thread(target=self._worker_loop, args=(dev_id,), daemon=True, name="AmbientVADWorker")
        self._thread.start()
        logger.info(f"[AMBIENT_LISTENER] Background ambient listener started on device: {dev_name}")
        return True

    def stop(self) -> bool:
        """
        Stops the ambient microphone capture stream and flushes any pending speech segments.
        """
        if not self._is_running:
            return True

        logger.info("[AMBIENT_LISTENER] Stopping ambient microphone listener...")
        self._is_running = False
        self._stop_event.set()

        # Stop and close sounddevice stream
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            except Exception as e:
                logger.debug(f"Error closing audio stream: {e}")
            finally:
                self._stream = None

        # Wait for worker thread
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.5)
            self._thread = None

        # Finalize any in-flight segment
        final_seg = self.vad.force_finalize()
        if final_seg:
            self._on_segment_completed(final_seg)

        self.status = "STOPPED"
        logger.info("[AMBIENT_LISTENER] Ambient listener stopped successfully.")
        return True

    def _audio_callback(self, indata, frames, time_info, status):
        """sounddevice stream callback executed in realtime audio thread."""
        if status:
            logger.debug(f"[AMBIENT_LISTENER] Audio stream status notice: {status}")
        if self._is_running:
            try:
                # Put a copy of frame into queue
                self._audio_queue.put_nowait(indata.copy())
            except queue.Full:
                pass # Drop oldest if processing lags

    def _worker_loop(self, device_id: Optional[int]):
        """Main processing loop running on dedicated background thread."""
        if not HAS_SOUNDDEVICE or sd is None:
            self.status = "ERROR"
            self.last_error = "sounddevice library is not available in environment"
            self._is_running = False
            logger.error(f"[AMBIENT_LISTENER] {self.last_error}")
            return

        sound_dev = sd
        try:
            self._stream = sound_dev.InputStream(
                samplerate=self.sample_rate,
                blocksize=self.blocksize,
                device=device_id,
                channels=1,
                dtype="int16",
                callback=self._audio_callback
            )
            self._stream.start()
            self.status = "LISTENING"
            logger.info("[AMBIENT_LISTENER] Audio input stream active and listening for speech...")
        except Exception as e:
            self.status = "ERROR"
            self.last_error = f"Audio stream initialization failed: {e}"
            self._is_running = False
            logger.error(f"[AMBIENT_LISTENER] {self.last_error}")
            return

        while not self._stop_event.is_set() and self._is_running:
            try:
                # Wait for audio block with timeout to allow clean stop
                frame = self._audio_queue.get(timeout=0.2)
            except queue.Empty:
                continue

            try:
                is_speaking, completed_segment = self.vad.process_frame(frame)
                if completed_segment:
                    self._on_segment_completed(completed_segment)
            except Exception as vad_err:
                logger.warning(f"[AMBIENT_LISTENER] VAD frame processing exception: {vad_err}")

        logger.debug("[AMBIENT_LISTENER] Worker loop exited.")

    def process_raw_audio_frames(self, frames: List[np.ndarray]) -> List[SpeechSegment]:
        """
        Synchronously processes a sequence of audio frames (for testing/file-based simulation).
        """
        detected: List[SpeechSegment] = []
        for f in frames:
            _, seg = self.vad.process_frame(f)
            if seg:
                detected.append(seg)
                self._on_segment_completed(seg)
        final_seg = self.vad.force_finalize()
        if final_seg:
            detected.append(final_seg)
            self._on_segment_completed(final_seg)
        return detected

    def _on_segment_completed(self, segment: SpeechSegment):
        """Internal handler called whenever a speech segment concludes."""
        self.segments_detected_count += 1
        self.last_segment_timestamp = segment.end_time
        self._recent_segments.append(segment)
        logger.info(f"[AMBIENT_SEGMENT] New speech episode detected (Duration: {segment.duration_seconds:.2f}s, Confidence: {segment.confidence:.2f})")

        # Notify callbacks asynchronously/safely
        for cb in list(self._segment_callbacks):
            try:
                cb(segment)
            except Exception as cb_err:
                logger.error(f"[AMBIENT_LISTENER] Error in segment callback: {cb_err}")

    def get_recent_segments(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns metadata for recent speech segments."""
        segments = list(self._recent_segments)[-limit:]
        return [s.to_dict() for s in reversed(segments)]

    def clear_recent_segments(self):
        """Clears the in-memory recent segment buffer."""
        self._recent_segments.clear()

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive status dictionary for monitoring and telemetry."""
        avail, dev_name, _ = self.check_microphone_availability()
        return {
            "status": self.status,
            "is_running": self._is_running,
            "is_speech_active": self.vad.is_speech_active,
            "microphone_available": avail,
            "active_device": self.active_device_name or dev_name,
            "segments_detected_count": self.segments_detected_count,
            "last_segment_timestamp": self.last_segment_timestamp,
            "last_error": self.last_error,
            "sample_rate": self.sample_rate,
            "frame_duration_ms": self.frame_duration_ms,
            "noise_floor": round(self.vad.noise_floor, 4)
        }

ambient_listener = AmbientMicListener()
