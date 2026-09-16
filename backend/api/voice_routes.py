import os
import base64
from fastapi import APIRouter, Response, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.voice.tts_engine import tts_engine, load_voice_config, save_voice_config, get_openai_key
from backend.voice.stt_engine import stt_engine

router = APIRouter(prefix="/voice", tags=["voice"])

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-ChristopherNeural"
    speed: Optional[float] = 1.0
    engine: Optional[str] = None

class VoiceConfigRequest(BaseModel):
    engine: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None

@router.post("/tts")
async def synthesize_speech(req: TTSRequest):
    if not req.text.strip():
        return Response(content=b"", media_type="audio/mpeg")

    success, audio_bytes, media_type = await tts_engine.synthesize_async(
        text=req.text,
        voice=req.voice,
        speed=req.speed or 1.0,
        engine=req.engine
    )
    if success and audio_bytes:
        return Response(content=audio_bytes, media_type=media_type)
    
    return {"use_client_speech": True, "error": media_type}

@router.post("/stt")
async def transcribe_audio(
    file: Optional[UploadFile] = File(None),
    language: Optional[str] = Form(None),
    provider: Optional[str] = Form("auto")
):
    """
    Speech-to-Text endpoint supporting Groq Whisper and OpenAI Whisper.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No audio file uploaded.")
    
    audio_bytes = await file.read()
    res = stt_engine.transcribe(
        audio_bytes=audio_bytes,
        filename=file.filename or "audio.wav",
        language=language,
        provider=provider or "auto"
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Transcription failed."))
    return res

@router.get("/engines")
def get_voice_engines():
    cfg = load_voice_config()
    has_openai = bool(get_openai_key())
    has_elevenlabs = bool(cfg.get("elevenlabs_api_key"))
    
    return {
        "tts_engines": [
            {"id": "edge_tts", "name": "Microsoft Edge Neural TTS", "available": True, "type": "neural_zero_cost", "default": True},
            {"id": "elevenlabs", "name": "ElevenLabs Cinematic Voice API", "available": has_elevenlabs, "type": "ultra_hd_neural"},
            {"id": "openai", "name": "OpenAI HD Audio Speech (tts-1-hd)", "available": has_openai, "type": "high_fidelity"}
        ],
        "stt_engines": [
            {"id": "groq_whisper", "name": "Groq Whisper-large-v3 (Ultra-Fast)", "available": True},
            {"id": "openai_whisper", "name": "OpenAI Whisper-1", "available": has_openai},
            {"id": "web_speech", "name": "Browser Web Speech API", "available": True}
        ],
        "active_engine": cfg.get("engine", "edge_tts"),
        "elevenlabs_configured": has_elevenlabs,
        "openai_configured": has_openai
    }

@router.get("/config")
def get_voice_config():
    cfg = load_voice_config()
    return {
        "engine": cfg.get("engine", "edge_tts"),
        "elevenlabs_voice_id": cfg.get("elevenlabs_voice_id", "pNInz6obpgDQGcFmaJgB"),
        "has_elevenlabs_key": bool(cfg.get("elevenlabs_api_key")),
        "has_openai_key": bool(get_openai_key())
    }

@router.post("/config")
def update_voice_config(req: VoiceConfigRequest):
    cfg = load_voice_config()
    if req.engine:
        cfg["engine"] = req.engine
    if req.elevenlabs_api_key is not None:
        cfg["elevenlabs_api_key"] = req.elevenlabs_api_key
    if req.elevenlabs_voice_id is not None:
        cfg["elevenlabs_voice_id"] = req.elevenlabs_voice_id
    save_voice_config(cfg)
    return {"success": True, "message": "Voice configuration updated."}
