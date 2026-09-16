from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
import numpy as np

@dataclass
class SpeechSegment:
    """
    Represents a detected, isolated speech segment from the ambient audio stream.
    
    Fields:
    - id: Unique segment identifier (UUID4)
    - start_time: Formatted start timestamp (HH:MM:SS or ISO-8601)
    - end_time: Formatted end timestamp (HH:MM:SS or ISO-8601)
    - start_epoch: Start timestamp in Unix epoch seconds (float)
    - end_epoch: End timestamp in Unix epoch seconds (float)
    - duration_seconds: Duration of speech activity in seconds
    - sample_rate: Audio sampling frequency in Hz (default: 16000)
    - confidence: Estimated speech confidence score (0.0 to 1.0)
    - audio_bytes: Raw 16-bit PCM audio payload (optional in serialization)
    - frame_count: Number of audio frames in segment
    - energy_level: Average RMS energy of speech activity
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    start_time: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    end_time: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
    start_epoch: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
    end_epoch: float = field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
    duration_seconds: float = 0.0
    sample_rate: int = 16000
    confidence: float = 1.0
    audio_bytes: bytes = field(default=b"", repr=False)
    frame_count: int = 0
    energy_level: float = 0.0

    def to_dict(self, include_audio: bool = False) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "start_epoch": round(self.start_epoch, 3),
            "end_epoch": round(self.end_epoch, 3),
            "duration_seconds": round(self.duration_seconds, 3),
            "sample_rate": self.sample_rate,
            "confidence": round(self.confidence, 3),
            "frame_count": self.frame_count,
            "energy_level": round(self.energy_level, 4)
        }
        if include_audio:
            data["audio_size_bytes"] = len(self.audio_bytes)
        return data
