import queue
import logging
import threading
from typing import Optional, Callable, List, Dict, Any

from backend.ambient_memory.config import ambient_config, AmbientMemoryConfig, AMBIENT_AUDIO_DIR
from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.storage import ambient_storage, AmbientMemoryStorage
from backend.ambient_memory.segment import SpeechSegment
from backend.ambient_memory.listener import ambient_listener, AmbientMicListener
from backend.ambient_memory.stt import ambient_stt_engine, AmbientSTTEngine, pcm_to_wav_bytes

logger = logging.getLogger("jarvis.ambient_memory.processor")

class AmbientStreamPipeline:
    """
    Asynchronous Streaming Pipeline for Ambient Memory.
    
    Architecture:
    Microphone (Listener)
      └──> VAD (Speech Segment Detection)
            └──> Thread-Safe Queue
                  └──> Background STT Worker Thread
                        └──> Audio Preservation (Optional)
                              └──> Persistent SQLite Memory Storage
    """

    def __init__(
        self,
        listener: Optional[AmbientMicListener] = None,
        stt_engine: Optional[AmbientSTTEngine] = None,
        storage: Optional[AmbientMemoryStorage] = None,
        config: Optional[AmbientMemoryConfig] = None
    ):
        self.listener = listener or ambient_listener
        self.stt = stt_engine or ambient_stt_engine
        self.storage = storage or ambient_storage
        self.config = config or ambient_config

        self._queue: queue.Queue = queue.Queue(maxsize=100)
        self._worker_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._is_running = False

        # Metrics & telemetry
        self.total_transcribed_count = 0
        self.last_transcribed_item: Optional[AmbientMemoryItem] = None
        self._memory_callbacks: List[Callable[[AmbientMemoryItem], None]] = []

    @property
    def is_running(self) -> bool:
        return self._is_running

    def add_memory_callback(self, callback: Callable[[AmbientMemoryItem], None]):
        """Registers a callback invoked when a new ambient memory is transcribed and stored."""
        if callback not in self._memory_callbacks:
            self._memory_callbacks.append(callback)

    def remove_memory_callback(self, callback: Callable[[AmbientMemoryItem], None]):
        """Removes a registered memory callback."""
        if callback in self._memory_callbacks:
            self._memory_callbacks.remove(callback)

    def start(self) -> bool:
        """Starts the asynchronous STT worker thread and microphone listener."""
        if self._is_running:
            logger.debug("[AMBIENT_PIPELINE] Pipeline is already running.")
            return True

        self.config.update(enabled=True)
        self._stop_event.clear()
        self._is_running = True

        # 1. Start dedicated transcription background worker thread
        self._worker_thread = threading.Thread(
            target=self._transcription_worker_loop,
            name="AmbientSTTWorkerThread",
            daemon=True
        )
        self._worker_thread.start()

        # 2. Register listener segment callback and start listening
        self.listener.add_segment_callback(self.enqueue_segment)
        mic_started = self.listener.start()

        logger.info(f"[AMBIENT_PIPELINE] Ambient stream pipeline started (Microphone listener active: {mic_started}).")
        return True

    def pause(self) -> bool:
        """Temporarily pauses transcription without shutting down the pipeline."""
        self.config.update(paused=True)
        logger.info("[AMBIENT_PIPELINE] Ambient memory paused.")
        return True

    def resume(self) -> bool:
        """Resumes active ambient listening and transcription."""
        self.config.update(paused=False)
        logger.info("[AMBIENT_PIPELINE] Ambient memory resumed.")
        return True

    def stop(self) -> bool:
        """Stops the ambient streaming pipeline and releases background threads."""
        if not self._is_running:
            return True

        logger.info("[AMBIENT_PIPELINE] Stopping ambient stream pipeline...")
        self._is_running = False
        self.config.update(enabled=False)
        self._stop_event.set()

        # Disconnect listener callback
        self.listener.remove_segment_callback(self.enqueue_segment)
        self.listener.stop()

        # Wake worker thread by pushing a sentinel
        self._queue.put(None)

        if self._worker_thread is not None and self._worker_thread.is_alive():
            self._worker_thread.join(timeout=2.0)
            self._worker_thread = None

        logger.info("[AMBIENT_PIPELINE] Ambient stream pipeline stopped.")
        return True

    def enqueue_segment(self, segment: SpeechSegment):
        """Pushes a detected SpeechSegment into the transcription queue if not paused."""
        if not self._is_running or self.config.paused:
            return
        try:
            self._queue.put_nowait(segment)
            logger.debug(f"[AMBIENT_PIPELINE] Enqueued speech segment for STT (Queue size: {self._queue.qsize()})")
        except queue.Full:
            logger.warning("[AMBIENT_PIPELINE] Transcription queue full, dropping oldest segment")

    def process_segment_synchronously(self, segment: SpeechSegment) -> AmbientMemoryItem:
        """
        Transcribes and persists a speech segment synchronously (useful for testing & offline batches).
        """
        item = self.stt.transcribe_segment(segment)
        
        # Save original audio if configured
        if self.config.save_audio and segment.audio_data:
            try:
                wav_bytes = pcm_to_wav_bytes(segment.audio_data, sample_rate=segment.sample_rate)
                audio_file = AMBIENT_AUDIO_DIR / f"{item.id}.wav"
                audio_file.write_bytes(wav_bytes)
                item.audio_reference = audio_file.name
            except Exception as audio_err:
                logger.error(f"[AMBIENT_PIPELINE] Error saving audio snippet: {audio_err}")

        saved_item = self.storage.save(item)
        self.total_transcribed_count += 1
        self.last_transcribed_item = saved_item
        return saved_item

    def _transcription_worker_loop(self):
        """Dedicated background worker thread that processes audio through STT."""
        logger.debug("[AMBIENT_PIPELINE] Transcription worker thread active.")
        while not self._stop_event.is_set():
            try:
                segment: Optional[SpeechSegment] = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue

            if segment is None:
                break # Sentinel received

            try:
                if not self.config.paused:
                    # Transcribe speech segment into timestamped AmbientMemoryItem
                    memory_item = self.stt.transcribe_segment(segment)

                    # Save audio if enabled
                    if self.config.save_audio and segment.audio_data:
                        try:
                            wav_bytes = pcm_to_wav_bytes(segment.audio_data, sample_rate=segment.sample_rate)
                            audio_file = AMBIENT_AUDIO_DIR / f"{memory_item.id}.wav"
                            audio_file.write_bytes(wav_bytes)
                            memory_item.audio_reference = audio_file.name
                        except Exception as audio_err:
                            logger.error(f"[AMBIENT_PIPELINE] Error saving audio snippet: {audio_err}")

                    # Persist to database
                    saved_item = self.storage.save(memory_item)
                    self.total_transcribed_count += 1
                    self.last_transcribed_item = saved_item

                    logger.info(
                        f"[AMBIENT_TRANSCRIPT] Stored episode [{saved_item.id[:8]}] [{saved_item.date} {saved_item.start_time} -> {saved_item.end_time}] "
                        f"({saved_item.language}, conf: {saved_item.confidence:.2f}, status: {saved_item.status})"
                    )

                    # Dispatch notifications to registered callbacks
                    for cb in list(self._memory_callbacks):
                        try:
                            cb(saved_item)
                        except Exception as cb_err:
                            logger.error(f"[AMBIENT_PIPELINE] Error in memory callback: {cb_err}")

            except Exception as proc_err:
                logger.error(f"[AMBIENT_PIPELINE] Error transcribing speech segment: {proc_err}")
            finally:
                self._queue.task_done()

        logger.debug("[AMBIENT_PIPELINE] Transcription worker thread finished.")

    def get_status(self) -> Dict[str, Any]:
        """Returns diagnostic telemetry of the ambient stream pipeline."""
        # Calculate status: OFF, PAUSED, LISTENING, PROCESSING
        if not self._is_running or not self.config.enabled:
            current_state = "OFF"
        elif self.config.paused:
            current_state = "PAUSED"
        elif self._queue.qsize() > 0:
            current_state = "PROCESSING"
        else:
            current_state = "LISTENING"

        return {
            "current_state": current_state,
            "pipeline_running": self._is_running,
            "enabled": self.config.enabled,
            "paused": self.config.paused,
            "save_audio": self.config.save_audio,
            "retention_days": self.config.retention_days,
            "listener": self.listener.get_status(),
            "pending_queue_size": self._queue.qsize(),
            "total_transcribed_count": self.total_transcribed_count,
            "last_transcription": self.last_transcribed_item.to_dict() if self.last_transcribed_item else None
        }

ambient_pipeline = AmbientStreamPipeline()
