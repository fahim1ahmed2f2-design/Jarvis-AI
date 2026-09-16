from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid

@dataclass
class AmbientMemoryItem:
    """
    Data model representing a discrete ambient auditory/contextual memory episode.
    
    Fields:
    - id: Unique identifier (UUID string)
    - date: Date of recording/capture (YYYY-MM-DD)
    - start_time: Start time of ambient segment (HH:MM:SS or ISO timestamp)
    - end_time: End time of ambient segment (HH:MM:SS or ISO timestamp)
    - transcript: Recognized ambient speech text or '[unclear speech]'
    - language: Detected/specified language (e.g. 'en', 'bn', 'bn-en', 'auto')
    - confidence: Confidence score (0.0 to 1.0)
    - audio_reference: Optional reference path/URI or identifier to audio snippet
    - status: Processing status ('processed', 'uncertain', 'pending', 'failed')
    - metadata: Optional additional contextual attributes (tags, speaker, environment)
    - created_at: Creation timestamp in ISO-8601 UTC
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    date: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    start_time: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%H:%M:%S"))
    end_time: str = field(default_factory=lambda: datetime.now(timezone.utc).strftime("%H:%M:%S"))
    transcript: str = ""
    language: str = "auto"
    confidence: float = 1.0
    audio_reference: Optional[str] = None
    status: str = "processed"
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AmbientMemoryItem":
        return cls(
            id=data.get("id") or str(uuid.uuid4()),
            date=data.get("date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            start_time=data.get("start_time") or datetime.now(timezone.utc).strftime("%H:%M:%S"),
            end_time=data.get("end_time") or datetime.now(timezone.utc).strftime("%H:%M:%S"),
            transcript=data.get("transcript", "").strip(),
            language=data.get("language", "auto"),
            confidence=float(data.get("confidence", 1.0)),
            audio_reference=data.get("audio_reference"),
            status=data.get("status", "processed"),
            metadata=data.get("metadata") or {},
            created_at=data.get("created_at") or datetime.now(timezone.utc).isoformat()
        )
