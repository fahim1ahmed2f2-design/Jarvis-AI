import os
import json
import hashlib
import asyncio
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
import edge_tts
import httpx

from backend.config import TTS_CACHE_DIR, DEFAULT_TTS_VOICE, DEFAULT_TTS_SPEED, DATA_DIR

logger = logging.getLogger("jarvis.voice.tts")

import re

VOICE_CONFIG_FILE = DATA_DIR / "voice_config.json"
CREDENTIALS_FILE = DATA_DIR / "ai_credentials.json"

# In-Memory RAM Audio Cache for ultra-fast instant playback (< 1ms)
_MEMORY_AUDIO_CACHE: Dict[str, bytes] = {}

# Voice Mapping for convenience
VOICE_MAP = {
    "alloy": "en-US-ChristopherNeural",
    "echo": "en-US-GuyNeural",
    "fable": "en-GB-RyanNeural",
    "onyx": "en-US-EricNeural",
    "nova": "en-US-JennyNeural",
    "shimmer": "en-US-AriaNeural",
    "jarvis": "en-GB-RyanNeural",
    "christopher": "en-US-ChristopherNeural",
    "guy": "en-US-GuyNeural",
    "eric": "en-US-EricNeural",
    "jenny": "en-US-JennyNeural",
    "aria": "en-US-AriaNeural",
    # Bengali Neural Voices
    "pradeep": "bn-BD-PradeepNeural",
    "nabanita": "bn-BD-NabanitaNeural",
    "bashkar": "bn-IN-BashkarNeural",
    "tanishaa": "bn-IN-TanishaaNeural",
    "bangla": "bn-BD-PradeepNeural",
    "bengali": "bn-BD-PradeepNeural"
}

# ElevenLabs preset voice IDs
ELEVENLABS_VOICES = {
    "jarvis_british": "pNInz6obpgDQGcFmaJgB",  # Adam - deep resonant tone
    "rachel": "21m00Tcm4TlvDq8ikWAM",
    "antoni": "ErXwobaYiN019PkySvjV",
    "elli": "MF3mGyEYCl7XYWbV9V6O",
    "josh": "TxGEqnHWrfWFTfGW9XjX"
}

def load_voice_config() -> Dict[str, Any]:
    default_cfg = {
        "engine": "edge_tts",  # "edge_tts", "elevenlabs", "openai"
        "elevenlabs_api_key": os.environ.get("ELEVENLABS_API_KEY", ""),
        "elevenlabs_voice_id": "pNInz6obpgDQGcFmaJgB"
    }
    if VOICE_CONFIG_FILE.exists():
        try:
            with open(VOICE_CONFIG_FILE, "r", encoding="utf-8") as f:
                return {**default_cfg, **json.load(f)}
        except Exception:
            pass
    return default_cfg

def save_voice_config(cfg: Dict[str, Any]):
    try:
        with open(VOICE_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving voice config: {e}")

def get_openai_key() -> Optional[str]:
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("keys", {}).get("openai")
        except Exception:
            pass
    return os.environ.get("OPENAI_API_KEY")

def sanitize_text_for_speech(text: str) -> str:
    """Cleans markdown symbols, code fences, urls, emojis, and normalizes acronyms for natural human speech."""
    t = text.strip()
    t = re.sub(r'```[\s\S]*?```', ' Code block omitted for brevity. ', t)
    t = re.sub(r'`([^`]+)`', r'\1', t)
    t = re.sub(r'^[#*>\-\+\d\.]+\s+', '', t, flags=re.MULTILINE)
    t = re.sub(r'[*_~]{1,3}([^*_~]+)[*_~]{1,3}', r'\1', t)
    t = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', t)
    t = re.sub(r'https?://\S+', '', t)
    
    # Replace em-dashes and long hyphens with comma for natural speech cadence
    t = re.sub(r'—|–|--', ', ', t)
    
    # Clean bullets and bracketed timestamps for natural vocalization
    t = re.sub(r'•\s*', '', t)
    t = re.sub(r'\[(\d{1,2}:\d{2})(?::\d{2})?\s*(?:-|to|থেকে)\s*(\d{1,2}:\d{2})(?::\d{2})?\]', r'\1 to \2, ', t)
    t = re.sub(r'\[(\d{1,2}:\d{2})(?::\d{2})?\]', r'\1, ', t)

    # Convert all-caps JARVIS / J.A.R.V.I.S. / J-A-R-V-I-S to title-case "Jarvis" for English
    t = re.sub(r'\bJ[\.\-\s]?A[\.\-\s]?R[\.\-\s]?V[\.\-\s]?I[\.\-\s]?S\b', 'Jarvis', t, flags=re.IGNORECASE)
    t = re.sub(r'\bJARVIS\b', 'Jarvis', t)

    # Masterclass Bengali Phonetic Transliteration & Normalization Engine
    # Ensures Edge-TTS Bengali Neural voices pronounce mixed English/Bangla text with crystal clarity
    is_bn = bool(re.search(r'[\u0980-\u09FF]', t))
    if is_bn:
        # 1. Core Identity & Form of Address
        t = re.sub(r'\b(?:JARVIS|Jarvis|jarvis)\b', 'জারভিস', t)
        t = re.sub(r'\b(?:Sir|sir|SIR)\b', 'স্যার', t)
        t = re.sub(r'\bTony\s+Stark\b', 'টনি স্টার্ক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bStark\b', 'স্টার্ক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?III\b|\bMark-?3\b', 'মার্ক থ্রি', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?II\b|\bMark-?2\b', 'মার্ক টু', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?IV\b|\bMark-?4\b', 'মার্ক ফোর', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?I\b|\bMark-?1\b', 'মার্ক ওয়ান', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSovereign\b', 'সোভারেন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bCore\b', 'কোর', t, flags=re.IGNORECASE)

        # 2. Version Normalization in Bengali
        t = re.sub(r'\bv(\d+)\.(\d+)\b', r'ভার্সন \1 পয়েন্ট \2', t, flags=re.IGNORECASE)
        t = re.sub(r'\bv(\d+)\b', r'ভার্সন \1', t, flags=re.IGNORECASE)
        t = re.sub(r'\bversion\s+(\d+)\.(\d+)\b', r'ভার্সন \1 পয়েন্ট \2', t, flags=re.IGNORECASE)
        t = re.sub(r'\bversion\s+(\d+)\b', r'ভার্সন \1', t, flags=re.IGNORECASE)

        # 3. Cultural & Natural Greetings Normalization
        t = re.sub(r'\b(?:নমস্কার|নমস্তে|প্রণাম)\b', 'হ্যালো', t)
        t = re.sub(r'\b(?:Assalamu\s*Alaikum|Assalamualaykum)\b', 'আসসালামু আলাইকুম', t, flags=re.IGNORECASE)
        t = re.sub(r'\b(?:Walaikum\s*Assalam|Walaikumas-salam)\b', 'ওয়ালাইকুম আসসালাম', t, flags=re.IGNORECASE)
        t = re.sub(r'\b(?:Thank\s*you|Thanks|Thx)\b', 'ধন্যবাদ', t, flags=re.IGNORECASE)
        t = re.sub(r'\b(?:Please|Kindly)\b', 'দয়া করে', t, flags=re.IGNORECASE)
        t = re.sub(r'\b(?:Hello|Hi|Hey)\b', 'হ্যালো', t, flags=re.IGNORECASE)
        t = re.sub(r'\b(?:OK|Ok|okay|Okay)\b', 'ঠিক আছে', t)

        # 4. Hardware, Units, Protocols & Technical Acronyms
        t = re.sub(r'100%', 'একশ শতাংশ', t)
        t = re.sub(r'%', ' শতাংশ ', t)
        t = re.sub(r'24/7', 'সার্বক্ষণিক', t)
        t = re.sub(r'°C', ' ডিগ্রি সেলসিয়াস ', t)
        t = re.sub(r'°F', ' ডিগ্রি ফারেনহাইট ', t)
        t = re.sub(r'°', ' ডিগ্রি ', t)
        t = re.sub(r'\bkm/h\b', ' কিলোমিটার প্রতি ঘণ্টা ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTB\b', ' টেরাবাইট ', t)
        t = re.sub(r'\bGB\b', ' গিগাবাইট ', t)
        t = re.sub(r'\bMB\b', ' মেগাবাইট ', t)
        t = re.sub(r'\bKB\b', ' কিলোবাইট ', t)
        t = re.sub(r'\bms\b', ' মিলিসেকেন্ড ', t)
        t = re.sub(r'\bGHz\b', ' গিগাহার্টজ ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMHz\b', ' মেগাহার্টজ ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bHz\b', ' হার্টজ ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bFPS\b', ' এফপিএস ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bCPU\b', 'সিপিইউ', t)
        t = re.sub(r'\bRAM\b', 'র‌্যাম', t)
        t = re.sub(r'\bGPU\b', 'জিপিইউ', t)
        t = re.sub(r'\bSSD\b', 'এসএসডি', t)
        t = re.sub(r'\bHDD\b', 'হার্ডডিস্ক', t)
        t = re.sub(r'\bWi-?Fi\b', 'ওয়াইফাই', t, flags=re.IGNORECASE)
        t = re.sub(r'\bBluetooth\b', 'ব্লুটুথ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bAQI\b', 'এয়ার কোয়ালিটি ইনডেক্স', t)
        t = re.sub(r'\bGPS\b', 'জিপিএস', t)
        t = re.sub(r'\bIP\b', 'আইপি', t)
        t = re.sub(r'\bAI\b', 'এআই', t)
        t = re.sub(r'\bPC\b', 'পিসি', t)
        t = re.sub(r'\bOS\b', 'ওএস', t)
        t = re.sub(r'\bUSB\b', 'ইউএসবি', t)
        t = re.sub(r'\bAPI\b', 'এপিআই', t)
        t = re.sub(r'\bURL\b', 'ইউআরএল', t)
        t = re.sub(r'\bID\b', 'আইডি', t)
        t = re.sub(r'\bSMS\b', 'এসএমএস', t)
        t = re.sub(r'\bPDF\b', 'পিডিএফ', t)

        # 5. Software, Platforms & Applications
        t = re.sub(r'\bGoogle\b', 'গুগল', t, flags=re.IGNORECASE)
        t = re.sub(r'\bYouTube\b', 'ইউটিউব', t, flags=re.IGNORECASE)
        t = re.sub(r'\bChrome\b', 'ক্রোম', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSpotify\b', 'স্পটিফাই', t, flags=re.IGNORECASE)
        t = re.sub(r'\bWindows\b', 'উইন্ডোজ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bVS\s*Code\b|\bvscode\b', 'ভিএস কোড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bPython\b', 'পাইথন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bJavaScript\b', 'জাভাস্ক্রিপ্ট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bPowerShell\b', 'পাওয়ারশেল', t, flags=re.IGNORECASE)
        t = re.sub(r'\bFacebook\b', 'ফেসবুক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bWhatsApp\b', 'হোয়াটসঅ্যাপ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTelegram\b', 'টেলিগ্রাম', t, flags=re.IGNORECASE)

        # 6. Common Tech & Action Vocabulary
        t = re.sub(r'\bOnline\b', 'অনলাইন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bOffline\b', 'অফলাইন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bReady\b', 'রেডি', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSystem\b|\bSystems\b', 'সিস্টেম', t, flags=re.IGNORECASE)
        t = re.sub(r'\bStatus\b', 'স্ট্যাটাস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bApp\b', 'অ্যাপ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bApps\b', 'অ্যাপস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bApplication\b', 'অ্যাপ্লিকেশন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bFile\b', 'ফাইল', t, flags=re.IGNORECASE)
        t = re.sub(r'\bFiles\b', 'ফাইলস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bFolder\b', 'ফোল্ডার', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTask\b', 'টাস্ক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTasks\b', 'টাস্কস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bVolume\b', 'ভলিউম', t, flags=re.IGNORECASE)
        t = re.sub(r'\bBrightness\b', 'ব্রাইটনেস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bBattery\b', 'ব্যাটারি', t, flags=re.IGNORECASE)
        t = re.sub(r'\bNetwork\b', 'নেটওয়ার্ক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bInternet\b', 'ইন্টারনেট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSpeed\b', 'স্পিড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bScreen\b', 'স্ক্রিন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bDisplay\b', 'ডিসপ্লে', t, flags=re.IGNORECASE)
        t = re.sub(r'\bVision\b', 'ভিশন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bAudio\b', 'অডিও', t, flags=re.IGNORECASE)
        t = re.sub(r'\bVoice\b', 'ভয়েস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMic\b|\bMicrophone\b', 'মাইক্রোফোন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSpeaker\b', 'স্পিকার', t, flags=re.IGNORECASE)
        t = re.sub(r'\bCamera\b', 'ক্যামেরা', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMemory\b', 'মেমরি', t, flags=re.IGNORECASE)
        t = re.sub(r'\bDiagnostic\b|\bDiagnostics\b', 'ডায়াগনস্টিক', t, flags=re.IGNORECASE)
        t = re.sub(r'\bOptimizer\b', 'অপটিমাইজার', t, flags=re.IGNORECASE)
        t = re.sub(r'\bDoctor\b', 'ডক্টর', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTurbo\b', 'টার্বো', t, flags=re.IGNORECASE)
        t = re.sub(r'\bBoost\b', 'বুস্ট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bCode\b', 'কোড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSearch\b', 'সার্চ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bUpdate\b', 'আপডেট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bUpgrade\b', 'আপগ্রেড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bDownload\b', 'ডাউনলোড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bUpload\b', 'আপলোড', t, flags=re.IGNORECASE)
        t = re.sub(r'\bOpen\b', 'ওপেন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bClose\b', 'ক্লোজ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bStart\b', 'স্টার্ট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bStop\b', 'স্টপ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bRestart\b', 'রিস্টার্ট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bSettings\b', 'সেটিংস', t, flags=re.IGNORECASE)
        t = re.sub(r'\bChat\b', 'চ্যাট', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMessage\b', 'মেসেজ', t, flags=re.IGNORECASE)
        t = re.sub(r'\bEmail\b|\bMail\b', 'ইমেইল', t, flags=re.IGNORECASE)
        t = re.sub(r'\bWeather\b', 'আবহাওয়া', t, flags=re.IGNORECASE)
        t = re.sub(r'\bTemperature\b', 'তাপমাত্রা', t, flags=re.IGNORECASE)
        t = re.sub(r'\bBitcoin\b|\bBTC\b', 'বিটকয়েন', t, flags=re.IGNORECASE)
        t = re.sub(r'\bDollar\b|\bUSD\b', 'ডলার', t, flags=re.IGNORECASE)
        t = re.sub(r'\bActive\b', 'অ্যাক্টিভ', t, flags=re.IGNORECASE)
    else:
        # English Roman numeral and version normalization
        t = re.sub(r'\bMark-?II\b', 'Mark Two', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?III\b', 'Mark Three', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?IV\b', 'Mark Four', t, flags=re.IGNORECASE)
        t = re.sub(r'\bMark-?I\b', 'Mark One', t, flags=re.IGNORECASE)
        t = re.sub(r'\bv(\d+)\.(\d+)\b', r'version \1 point \2', t, flags=re.IGNORECASE)
        t = re.sub(r'\bv(\d+)\b', r'version \1', t, flags=re.IGNORECASE)
    
    t = re.sub(r'[^\w\s.,!?;:\'\"\-()%/\u0964\u0965\u0980-\u09FF]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

class TTSEngine:
    def __init__(self):
        self.cache_dir = TTS_CACHE_DIR

    def _get_cache_path(self, text: str, voice: str, speed: float, engine: str = "edge") -> Path:
        key = f"{text}_{voice}_{speed}_{engine}".encode("utf-8")
        hash_name = hashlib.md5(key).hexdigest()
        return self.cache_dir / f"tts_{hash_name}.mp3"

    async def synthesize_elevenlabs_async(self, text: str, voice_id: Optional[str] = None) -> Tuple[bool, bytes, str]:
        cfg = load_voice_config()
        api_key = cfg.get("elevenlabs_api_key")
        if not api_key:
            return False, b"", "ElevenLabs API Key not configured"

        v_id = voice_id or cfg.get("elevenlabs_voice_id", "pNInz6obpgDQGcFmaJgB")
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{v_id}"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200 and len(res.content) > 500:
                    return True, res.content, "audio/mpeg"
                return False, b"", f"ElevenLabs status {res.status_code}: {res.text[:100]}"
        except Exception as e:
            return False, b"", str(e)

    async def synthesize_openai_async(self, text: str, voice: str = "alloy", model: str = "tts-1") -> Tuple[bool, bytes, str]:
        api_key = get_openai_key()
        if not api_key:
            return False, b"", "OpenAI API Key not configured"

        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "input": text,
            "voice": voice if voice in ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] else "fable"
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200 and len(res.content) > 500:
                    return True, res.content, "audio/mpeg"
                return False, b"", f"OpenAI TTS status {res.status_code}: {res.text[:100]}"
        except Exception as e:
            return False, b"", str(e)

    async def synthesize_async(
        self,
        text: str,
        voice: Optional[str] = None,
        speed: float = 1.0,
        engine: Optional[str] = None
    ) -> Tuple[bool, bytes, str]:
        """
        Unified multi-engine TTS synthesizer:
        1. ElevenLabs (if configured and requested)
        2. OpenAI HD TTS (if requested or key available)
        3. Microsoft Edge Neural TTS (Free, default, with instant Bengali script detection)
        """
        clean_text = sanitize_text_for_speech(text)
        if not clean_text:
            return False, b"", "Empty text"

        cfg = load_voice_config()
        selected_engine = engine or cfg.get("engine", "edge_tts")

        # 1. Try ElevenLabs if specified
        if selected_engine == "elevenlabs" and cfg.get("elevenlabs_api_key"):
            ok, audio_b, mime = await self.synthesize_elevenlabs_async(clean_text)
            if ok:
                return True, audio_b, mime
            logger.warning(f"ElevenLabs failed ({mime}), falling back to Edge-TTS.")

        # 2. Try OpenAI TTS if specified
        if selected_engine == "openai" and get_openai_key():
            ok, audio_b, mime = await self.synthesize_openai_async(clean_text, voice=voice or "fable")
            if ok:
                return True, audio_b, mime
            logger.warning(f"OpenAI TTS failed ({mime}), falling back to Edge-TTS.")

        # 3. Microsoft Edge Neural TTS (Ultra-reliable default)
        is_bengali = bool(re.search(r'[\u0980-\u09FF]', clean_text))
        target_voice = voice or DEFAULT_TTS_VOICE
        if target_voice.lower() in VOICE_MAP:
            target_voice = VOICE_MAP[target_voice.lower()]

        if is_bengali and not target_voice.startswith("bn-"):
            if any(f in target_voice.lower() for f in ["jenny", "aria", "nova", "shimmer"]):
                target_voice = "bn-BD-NabanitaNeural"
            else:
                target_voice = "bn-BD-PradeepNeural"

        rate_pct = int((speed - 1.0) * 100)
        rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"

        # In-Memory RAM Cache for sub-millisecond audio retrieval
        mem_key = f"{clean_text}_{target_voice}_{speed}_edge"
        if mem_key in _MEMORY_AUDIO_CACHE:
            return True, _MEMORY_AUDIO_CACHE[mem_key], "audio/mpeg"

        cache_path = self._get_cache_path(clean_text, target_voice, speed, "edge")
        if cache_path.exists():
            try:
                audio_bytes = cache_path.read_bytes()
                _MEMORY_AUDIO_CACHE[mem_key] = audio_bytes
                return True, audio_bytes, "audio/mpeg"
            except Exception:
                pass

        try:
            communicate = edge_tts.Communicate(clean_text, target_voice, rate=rate_str)
            audio_bytes = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_bytes += chunk["data"]

            if audio_bytes:
                _MEMORY_AUDIO_CACHE[mem_key] = audio_bytes
                if len(_MEMORY_AUDIO_CACHE) > 500:
                    _MEMORY_AUDIO_CACHE.pop(next(iter(_MEMORY_AUDIO_CACHE)))
                try:
                    cache_path.write_bytes(audio_bytes)
                except Exception:
                    pass
                return True, audio_bytes, "audio/mpeg"
            return False, b"", "No audio generated"
        except Exception as e:
            logger.error(f"Edge-TTS synthesis error: {e}")
            return False, b"", str(e)

    def synthesize(self, text: str, voice: Optional[str] = None, speed: float = 1.0) -> Tuple[bool, bytes, str]:
        """Synchronous wrapper for synthesize_async."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, self.synthesize_async(text, voice, speed)).result()
            return loop.run_until_complete(self.synthesize_async(text, voice, speed))
        except RuntimeError:
            return asyncio.run(self.synthesize_async(text, voice, speed))

tts_engine = TTSEngine()
