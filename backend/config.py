import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True, parents=True)

# Specific Data Directories
RECORDINGS_DIR = DATA_DIR / "recordings"
TEMP_DIR = DATA_DIR / "temp"
TTS_CACHE_DIR = DATA_DIR / "tts_cache"
SCREENSHOTS_DIR = DATA_DIR / "screenshots"

for d in [RECORDINGS_DIR, TEMP_DIR, TTS_CACHE_DIR, SCREENSHOTS_DIR]:
    d.mkdir(exist_ok=True, parents=True)

# Database Path
DB_PATH = DATA_DIR / "jarvis.db"

# Load .env file
ENV_FILE = BASE_DIR / ".env"
if not ENV_FILE.exists():
    ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
else:
    load_dotenv()

# ── System Config ─────────────────────────────────────────────
JARVIS_VERSION = "3.0.0"
JARVIS_CODENAME = "Mark-III Sovereign"
JARVIS_BUILD = "v3.0.0-release"
HOST = os.getenv("JARVIS_HOST", "127.0.0.1")
PORT = int(os.getenv("JARVIS_PORT", "8000"))
DEBUG = os.getenv("JARVIS_DEBUG", "false").lower() == "true"
ENVIRONMENT = os.getenv("JARVIS_ENV", "production")

# ── AI Providers & Default Models ─────────────────────────────
DEFAULT_PROVIDER = os.getenv("ACTIVE_AI_PROVIDER", "gemini")
DEFAULT_MODEL = os.getenv("ACTIVE_AI_MODEL", "gemini-3.5-flash-lite")

# ── V3: Provider Capability Tiers ─────────────────────────────
AI_PROVIDERS_CONFIG: Dict[str, Dict[str, Any]] = {
    "gemini": {
        "name": "Google Gemini",
        "env_key": "GEMINI_API_KEY",
        "default_model": "gemini-3.5-flash-lite",
        "models": [
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-pro-latest"
        ],
        "tier": "FREE",
        "capability": "MULTIMODAL",
        "free_info": {
            "is_free": "Free Tier Available",
            "badge": "FREE TIER",
            "url": "https://aistudio.google.com/app/apikey",
            "note": "Get a free API key with generous quota from Google AI Studio."
        }
    },
    "groq": {
        "name": "Groq Cloud",
        "env_key": "GROQ_API_KEY",
        "default_model": "llama-3.3-70b-versatile",
        "models": [
            "llama-3.3-70b-versatile",
            "deepseek-r1-distill-llama-70b",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it"
        ],
        "tier": "FREE",
        "capability": "ULTRA_FAST",
        "free_info": {
            "is_free": "Free & Ultra-Fast",
            "badge": "ULTRA-FAST FREE",
            "url": "https://console.groq.com/keys",
            "note": "Ultra-fast inference (500+ tokens/sec) with free tier."
        }
    },
    "deepseek": {
        "name": "DeepSeek AI",
        "env_key": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat",
        "models": ["deepseek-chat", "deepseek-reasoner"],
        "tier": "AFFORDABLE",
        "capability": "REASONING",
        "free_info": {
            "is_free": "Affordable / High Reasoning",
            "badge": "REASONING LEADER",
            "url": "https://platform.deepseek.com/api_keys",
            "note": "Industry-leading reasoning intelligence at low cost."
        }
    },
    "openai": {
        "name": "OpenAI",
        "env_key": "OPENAI_API_KEY",
        "default_model": "gpt-4o",
        "models": ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4.5-preview"],
        "tier": "PREMIUM",
        "capability": "GENERAL",
        "free_info": {
            "is_free": "Paid / Tiered",
            "badge": "PREMIUM",
            "url": "https://platform.openai.com/api-keys",
            "note": "Standard industry benchmark models."
        }
    },
    "claude": {
        "name": "Anthropic Claude",
        "env_key": "ANTHROPIC_API_KEY",
        "default_model": "claude-3-7-sonnet-20250219",
        "models": [
            "claude-3-7-sonnet-20250219",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022"
        ],
        "tier": "PREMIUM",
        "capability": "CODING",
        "free_info": {
            "is_free": "Paid / Tiered",
            "badge": "PREMIUM",
            "url": "https://console.anthropic.com/settings/keys",
            "note": "Top tier coding and nuance understanding."
        }
    },
    "local": {
        "name": "Ollama / Local LLM",
        "env_key": "OLLAMA_HOST",
        "default_model": "llama3:latest",
        "models": ["llama3:latest", "mistral:latest", "qwen2.5-coder:latest", "deepseek-r1:latest"],
        "tier": "OFFLINE",
        "capability": "PRIVATE",
        "free_info": {
            "is_free": "100% Free / Offline",
            "badge": "OFFLINE FREE",
            "url": "https://ollama.com/download",
            "note": "Runs completely locally on your hardware without internet."
        }
    }
}

# ── Key Storage ────────────────────────────────────────────────
CREDENTIALS_STATE_FILE = DATA_DIR / "ai_credentials.json"

# ── Voice & TTS Config ─────────────────────────────────────────
DEFAULT_TTS_VOICE = os.getenv("JARVIS_TTS_VOICE", "en-GB-RyanNeural")
DEFAULT_TTS_SPEED = float(os.getenv("JARVIS_TTS_SPEED", "1.0"))

# ── V3: Automation Safety ──────────────────────────────────────
SAFETY_MODE = os.getenv("JARVIS_SAFETY_MODE", "STANDARD")  # STRICT, STANDARD, AUTONOMOUS

# ── V3: Intelligence Settings ──────────────────────────────────
MAX_CONVERSATION_HISTORY = int(os.getenv("JARVIS_MAX_HISTORY", "20"))
MEMORY_INJECTION_LIMIT = int(os.getenv("JARVIS_MEMORY_LIMIT", "5"))
ENABLE_PROACTIVE_INTELLIGENCE = os.getenv("JARVIS_PROACTIVE", "true").lower() == "true"
ENABLE_EMOTION_DETECTION = os.getenv("JARVIS_EMOTION", "true").lower() == "true"
