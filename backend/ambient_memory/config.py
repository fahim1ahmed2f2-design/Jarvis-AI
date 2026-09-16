import os
import json
import logging
from pathlib import Path
from typing import Dict, Any
from backend.config import DATA_DIR

logger = logging.getLogger("jarvis.ambient_memory.config")

# Ambient Audio Storage Directory (isolated storage for audio refs)
AMBIENT_DATA_DIR = DATA_DIR / "ambient_memory"
AMBIENT_DATA_DIR.mkdir(exist_ok=True, parents=True)

AMBIENT_AUDIO_DIR = AMBIENT_DATA_DIR / "audio_snippets"
AMBIENT_AUDIO_DIR.mkdir(exist_ok=True, parents=True)

AMBIENT_CONFIG_FILE = AMBIENT_DATA_DIR / "ambient_config.json"

class AmbientMemoryConfig:
    """
    Configuration settings for Ambient Memory module.
    Completely isolated from active voice/STT hardware settings.
    Persists configuration across restarts.
    """
    def __init__(self):
        # Default OFF unless explicitly enabled
        self.enabled: bool = False
        self.paused: bool = False
        self.save_audio: bool = False
        self.retention_days: int = 30  # 1, 7, 30, 0 (forever)
        self.max_records: int = 10000
        self.default_language: str = "auto"
        self.min_confidence_threshold: float = 0.40
        self.storage_dir: Path = AMBIENT_DATA_DIR
        self.audio_dir: Path = AMBIENT_AUDIO_DIR
        self.load_config()

    def load_config(self):
        """Loads configuration from persistent JSON file if exists."""
        if AMBIENT_CONFIG_FILE.exists():
            try:
                with open(AMBIENT_CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.enabled = bool(data.get("enabled", False))
                    self.paused = bool(data.get("paused", False))
                    self.save_audio = bool(data.get("save_audio", False))
                    self.retention_days = int(data.get("retention_days", 30))
                    self.max_records = int(data.get("max_records", 10000))
                    self.default_language = data.get("default_language", "auto")
                    self.min_confidence_threshold = float(data.get("min_confidence_threshold", 0.40))
            except Exception as e:
                logger.error(f"Error loading ambient config file: {e}")

    def save_config(self):
        """Persists current configuration to disk."""
        try:
            with open(AMBIENT_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(self.to_dict(), f, indent=2)
        except Exception as e:
            logger.error(f"Error saving ambient config file: {e}")

    def update(self, **kwargs) -> Dict[str, Any]:
        """Updates and persists configuration fields."""
        if "enabled" in kwargs and kwargs["enabled"] is not None:
            self.enabled = bool(kwargs["enabled"])
        if "paused" in kwargs and kwargs["paused"] is not None:
            self.paused = bool(kwargs["paused"])
        if "save_audio" in kwargs and kwargs["save_audio"] is not None:
            self.save_audio = bool(kwargs["save_audio"])
        if "retention_days" in kwargs and kwargs["retention_days"] is not None:
            self.retention_days = int(kwargs["retention_days"])
        if "max_records" in kwargs and kwargs["max_records"] is not None:
            self.max_records = int(kwargs["max_records"])
        if "default_language" in kwargs and kwargs["default_language"] is not None:
            self.default_language = str(kwargs["default_language"])
        if "min_confidence_threshold" in kwargs and kwargs["min_confidence_threshold"] is not None:
            self.min_confidence_threshold = float(kwargs["min_confidence_threshold"])
        
        self.save_config()
        return self.to_dict()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "enabled": self.enabled,
            "paused": self.paused,
            "save_audio": self.save_audio,
            "retention_days": self.retention_days,
            "max_records": self.max_records,
            "default_language": self.default_language,
            "min_confidence_threshold": self.min_confidence_threshold,
            "storage_dir": str(self.storage_dir),
            "audio_dir": str(self.audio_dir)
        }

ambient_config = AmbientMemoryConfig()
