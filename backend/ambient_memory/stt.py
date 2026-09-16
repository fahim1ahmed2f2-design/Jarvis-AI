import io
import re
import wave
import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import httpx

from backend.config import DATA_DIR, CREDENTIALS_STATE_FILE
from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.segment import SpeechSegment

logger = logging.getLogger("jarvis.ambient_memory.stt")

# Hallucination and subtitle artifact filters common in Whisper models on low-volume background noise
WHISPER_HALLUCINATION_PATTERNS = [
    r'^(?:thank\s+you(?:\s+for\s+watching)?[\s.!?,]*)+$',
    r'^(?:subtitles\s+by|subtitled\s+by|transcription\s+by)[\s\S]*$',
    r'^(?:please\s+subscribe|like\s+and\s+subscribe)[\s.!?,]*$',
    r'^(?:\.+|\?+|\!+|\-+|\*+)$',
    r'^(?:you|bye|the\s+end|silence|applause|laughter|music|cheering)[\s.!?,]*$',
    r'^(?:\[.*?\]|\(.*?\))$'
]

def get_api_key(provider: str) -> Optional[str]:
    """Retrieves configured API key from persistent credentials state or environment."""
    import os
    if CREDENTIALS_STATE_FILE.exists():
        try:
            with open(CREDENTIALS_STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                key = data.get("keys", {}).get(provider)
                if key and str(key).strip():
                    return str(key).strip()
        except Exception:
            pass
    env_keys = {
        "groq": "GROQ_API_KEY",
        "openai": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY"
    }
    return os.getenv(env_keys.get(provider, ""), None)

def pcm_to_wav_bytes(pcm_bytes: bytes, sample_rate: int = 16000, num_channels: int = 1, sample_width: int = 2) -> bytes:
    """Encapsulates raw 16-bit PCM audio stream into standard RIFF WAV format."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(num_channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_bytes)
    return buf.getvalue()

def detect_mixed_language(text: str) -> str:
    """
    Detects language characteristics:
    - 'bn': Pure Bengali script
    - 'en': Pure English/Latin script
    - 'bn-en': Mixed code-switching (Bangla + English)
    """
    clean = text.strip()
    if not clean:
        return "auto"
    has_bn = bool(re.search(r'[\u0980-\u09FF]', clean))
    has_en = bool(re.search(r'[A-Za-z]', clean))

    if has_bn and has_en:
        return "bn-en"
    elif has_bn:
        return "bn"
    elif has_en:
        return "en"
    return "auto"

def is_hallucination_or_noise(text: str) -> bool:
    """Checks if transcribed text matches common Whisper silence/noise artifact patterns."""
    t = text.strip().lower()
    if not t or len(t) <= 1:
        return True
    for pattern in WHISPER_HALLUCINATION_PATTERNS:
        if re.match(pattern, t, flags=re.IGNORECASE):
            return True
    # Repetition check (e.g. "ha ha ha ha ha", "la la la la")
    words = t.split()
    if len(words) >= 4 and len(set(words)) == 1:
        return True
    return False

class AmbientSTTEngine:
    """
    Multi-Provider Speech-to-Text Engine for Ambient Memory.
    
    Supports:
    1. Groq Whisper Large v3 (Multilingual, ultra-low latency <500ms, English & Bengali)
    2. OpenAI Whisper-1 (Industry standard accuracy)
    3. Safe Non-Guessing Policy (Marks low-confidence or noisy audio as '[unclear speech]')
    """

    def __init__(self, provider: str = "auto"):
        self.provider = provider

    def transcribe_segment(self, segment: SpeechSegment) -> AmbientMemoryItem:
        """
        Transcribes a SpeechSegment into an accurate, timestamped AmbientMemoryItem.
        Preserves original start/end timestamps and never invents words.
        """
        raw_pcm = segment.audio_bytes
        sample_rate = segment.sample_rate or 16000

        # Extract date from start_time (formatted as "YYYY-MM-DD HH:MM:SS" or fallback)
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_time_str = segment.start_time
        end_time_str = segment.end_time

        if " " in segment.start_time:
            parts = segment.start_time.split(" ")
            date_str = parts[0]
            start_time_str = parts[1]

        if " " in segment.end_time:
            end_time_str = segment.end_time.split(" ")[1]

        # Guard: Check audio size and duration
        if not raw_pcm or len(raw_pcm) < (sample_rate * 0.2 * 2): # < 0.2s
            return AmbientMemoryItem(
                date=date_str,
                start_time=start_time_str,
                end_time=end_time_str,
                transcript="[unclear speech]",
                language="auto",
                confidence=0.1,
                metadata={
                    "duration_seconds": segment.duration_seconds,
                    "is_uncertain": True,
                    "reason": "Segment too short"
                }
            )

        # Convert to WAV container
        wav_bytes = pcm_to_wav_bytes(raw_pcm, sample_rate=sample_rate)

        # Perform Transcription
        result = self._execute_stt_transcription(wav_bytes)

        raw_text = result.get("text", "").strip()
        confidence = float(result.get("confidence", 0.95))
        engine_used = result.get("engine", "unknown")
        is_uncertain = False

        # Guard against hallucination, silence artifacts, or low energy noise
        if not result.get("success") or not raw_text or is_hallucination_or_noise(raw_text):
            transcript_text = "[unclear speech]"
            detected_lang = "auto"
            confidence = 0.2
            is_uncertain = True
        elif result.get("is_uncertain") or confidence < 0.40:
            transcript_text = f"[unclear: {raw_text}]" if raw_text else "[unclear speech]"
            detected_lang = detect_mixed_language(raw_text)
            is_uncertain = True
        else:
            transcript_text = raw_text
            detected_lang = detect_mixed_language(raw_text)

        metadata = {
            "duration_seconds": segment.duration_seconds,
            "energy_level": segment.energy_level,
            "stt_engine": engine_used,
            "is_uncertain": is_uncertain,
            "start_epoch": segment.start_epoch,
            "end_epoch": segment.end_epoch
        }
        if result.get("error"):
            metadata["stt_error"] = result["error"]

        status_val = "uncertain" if is_uncertain else "processed"

        return AmbientMemoryItem(
            date=date_str,
            start_time=start_time_str,
            end_time=end_time_str,
            transcript=transcript_text,
            language=detected_lang,
            confidence=confidence,
            audio_reference=None,
            status=status_val,
            metadata=metadata
        )

    def _execute_stt_transcription(self, wav_bytes: bytes) -> Dict[str, Any]:
        """Routes audio payload to configured or available Whisper STT service."""
        groq_key = get_api_key("groq")
        openai_key = get_api_key("openai")

        target = self.provider
        if target == "auto":
            if groq_key:
                target = "groq"
            elif openai_key:
                target = "openai"
            else:
                target = "none"

        # 1. Try Groq Whisper Large v3
        if target == "groq" and groq_key:
            try:
                files = {"file": ("ambient_segment.wav", wav_bytes, "audio/wav")}
                data = {
                    "model": "whisper-large-v3",
                    "response_format": "verbose_json",
                    "temperature": "0.0"
                }
                headers = {"Authorization": f"Bearer {groq_key}"}
                with httpx.Client(timeout=15.0) as client:
                    res = client.post(
                        "https://api.groq.com/openai/v1/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data
                    )
                    if res.status_code == 200:
                        resp_json = res.json()
                        text = resp_json.get("text", "").strip()
                        lang = resp_json.get("language", "auto")
                        return {
                            "success": True,
                            "text": text,
                            "language": lang,
                            "engine": "groq_whisper_large_v3",
                            "confidence": 0.98
                        }
                    logger.warning(f"[AMBIENT_STT] Groq Whisper returned status {res.status_code}: {res.text[:120]}")
            except Exception as e:
                logger.error(f"[AMBIENT_STT] Groq Whisper exception: {e}")

        # 2. Try OpenAI Whisper-1
        if (target in ["openai", "auto"] or not groq_key) and openai_key:
            try:
                files = {"file": ("ambient_segment.wav", wav_bytes, "audio/wav")}
                data = {
                    "model": "whisper-1",
                    "response_format": "json",
                    "temperature": "0.0"
                }
                headers = {"Authorization": f"Bearer {openai_key}"}
                with httpx.Client(timeout=15.0) as client:
                    res = client.post(
                        "https://api.openai.com/v1/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data
                    )
                    if res.status_code == 200:
                        text = res.json().get("text", "").strip()
                        return {
                            "success": True,
                            "text": text,
                            "engine": "openai_whisper_1",
                            "confidence": 0.96
                        }
                    logger.warning(f"[AMBIENT_STT] OpenAI Whisper error: {res.text[:120]}")
            except Exception as e:
                logger.error(f"[AMBIENT_STT] OpenAI Whisper exception: {e}")

        # 3. Fallback when no active online STT provider is configured
        return {
            "success": False,
            "text": "",
            "engine": "none",
            "error": "No Whisper STT provider key available (Groq/OpenAI)",
            "is_uncertain": True,
            "confidence": 0.0
        }

ambient_stt_engine = AmbientSTTEngine()
