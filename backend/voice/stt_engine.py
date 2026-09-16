import io
import json
import logging
from typing import Dict, Any, Optional
import httpx

from backend.config import DATA_DIR

logger = logging.getLogger("jarvis.voice.stt")

CREDENTIALS_FILE = DATA_DIR / "ai_credentials.json"

def get_stored_key(provider: str) -> Optional[str]:
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("keys", {}).get(provider)
        except Exception:
            pass
    return None

class STTEngine:
    """
    Next-generation multi-provider Speech-to-Text Transcription Engine.
    Supports:
    1. Groq Whisper-large-v3 (Lightning fast, <500ms, free tier)
    2. OpenAI Whisper-1 (Industry standard accuracy)
    """
    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        language: Optional[str] = None,
        provider: str = "auto"
    ) -> Dict[str, Any]:
        if not audio_bytes or len(audio_bytes) < 100:
            return {"success": False, "error": "Audio stream is too short or empty."}

        # 1. Try Groq Whisper if available or requested
        groq_key = get_stored_key("groq")
        openai_key = get_stored_key("openai")

        target_provider = provider
        if target_provider == "auto":
            if groq_key:
                target_provider = "groq"
            elif openai_key:
                target_provider = "openai"
            else:
                target_provider = "none"

        if target_provider == "groq" and groq_key:
            try:
                files = {"file": (filename, audio_bytes, "audio/wav")}
                data = {"model": "whisper-large-v3", "response_format": "json"}
                if language:
                    data["language"] = language

                headers = {"Authorization": f"Bearer {groq_key}"}
                with httpx.Client(timeout=15.0) as client:
                    res = client.post("https://api.groq.com/openai/v1/audio/transcriptions", headers=headers, files=files, data=data)
                    if res.status_code == 200:
                        text = res.json().get("text", "").strip()
                        return {
                            "success": True,
                            "text": text,
                            "engine": "groq_whisper_large_v3",
                            "confidence": 0.98
                        }
                    logger.warning(f"Groq Whisper error: {res.text}")
            except Exception as e:
                logger.error(f"Groq Whisper transcription failed: {e}")

        # 2. Try OpenAI Whisper-1
        if (target_provider in ["openai", "auto"] or not groq_key) and openai_key:
            try:
                files = {"file": (filename, audio_bytes, "audio/wav")}
                data = {"model": "whisper-1", "response_format": "json"}
                if language:
                    data["language"] = language

                headers = {"Authorization": f"Bearer {openai_key}"}
                with httpx.Client(timeout=20.0) as client:
                    res = client.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files, data=data)
                    if res.status_code == 200:
                        text = res.json().get("text", "").strip()
                        return {
                            "success": True,
                            "text": text,
                            "engine": "openai_whisper_1",
                            "confidence": 0.97
                        }
                    logger.warning(f"OpenAI Whisper error: {res.text}")
            except Exception as e:
                logger.error(f"OpenAI Whisper transcription failed: {e}")

        return {
            "success": False,
            "error": "No Whisper STT provider configured. Add an OpenAI or Groq API key in Settings.",
            "available_engines": ["groq_whisper_large_v3", "openai_whisper_1"]
        }

stt_engine = STTEngine()
