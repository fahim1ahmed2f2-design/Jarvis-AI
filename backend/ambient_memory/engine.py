import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from backend.ambient_memory.config import ambient_config
from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.storage import ambient_storage, AmbientMemoryStorage

logger = logging.getLogger("jarvis.ambient_memory.engine")

class AmbientMemoryEngine:
    """
    Core Memory Management Engine for Ambient Memory.
    
    Provides safe, isolated operations for persisting, querying, and managing
    ambient auditory episodes across restarts.
    """
    def __init__(self, storage: Optional[AmbientMemoryStorage] = None):
        self.storage = storage or ambient_storage
        self.config = ambient_config

    def create_memory(
        self,
        transcript: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        date: Optional[str] = None,
        language: str = "auto",
        confidence: float = 1.0,
        audio_reference: Optional[str] = None,
        status: str = "processed",
        metadata: Optional[Dict[str, Any]] = None,
        memory_id: Optional[str] = None
    ) -> AmbientMemoryItem:
        """Constructs a validated AmbientMemoryItem instance."""
        now = datetime.now(timezone.utc)
        curr_date = date or now.strftime("%Y-%m-%d")
        curr_start = start_time or now.strftime("%H:%M:%S")
        curr_end = end_time or now.strftime("%H:%M:%S")

        return AmbientMemoryItem(
            id=memory_id or str(uuid.uuid4()),
            date=curr_date,
            start_time=curr_start,
            end_time=curr_end,
            transcript=transcript.strip(),
            language=language or self.config.default_language,
            confidence=max(0.0, min(1.0, float(confidence))),
            audio_reference=audio_reference,
            status=status or "processed",
            metadata=metadata or {},
            created_at=now.isoformat()
        )

    def save_memory(self, item: AmbientMemoryItem) -> AmbientMemoryItem:
        """Persists an AmbientMemoryItem to local storage."""
        return self.storage.save(item)

    def add_memory(
        self,
        transcript: str,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        date: Optional[str] = None,
        language: str = "auto",
        confidence: float = 1.0,
        audio_reference: Optional[str] = None,
        status: str = "processed",
        metadata: Optional[Dict[str, Any]] = None
    ) -> AmbientMemoryItem:
        """Convenience method: Creates and immediately saves an ambient memory item."""
        item = self.create_memory(
            transcript=transcript,
            start_time=start_time,
            end_time=end_time,
            date=date,
            language=language,
            confidence=confidence,
            audio_reference=audio_reference,
            status=status,
            metadata=metadata
        )
        return self.save_memory(item)

    def get_memory_by_id(self, memory_id: str) -> Optional[AmbientMemoryItem]:
        """Retrieves a single ambient memory item by ID."""
        return self.storage.get_by_id(memory_id)

    def retrieve_memory(self, memory_id: str) -> Optional[AmbientMemoryItem]:
        """Alias for get_memory_by_id."""
        return self.get_memory_by_id(memory_id)

    def get_memory(self, memory_id: str) -> Optional[AmbientMemoryItem]:
        """Alias for get_memory_by_id."""
        return self.get_memory_by_id(memory_id)

    def get_memories_by_date(self, date_str: str, limit: int = 100, offset: int = 0) -> List[AmbientMemoryItem]:
        """Retrieves all ambient memories recorded on a specific date (YYYY-MM-DD)."""
        return self.storage.get_by_date(date_str, limit=limit, offset=offset)

    def get_memories_by_time_range(
        self,
        date_str: str,
        start_time: str,
        end_time: str,
        limit: int = 200
    ) -> List[AmbientMemoryItem]:
        """Retrieves ambient memories within a specified time range on a date."""
        return self.storage.get_by_time_range(
            date_str=date_str,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )

    def retrieve_all_memories(
        self,
        date: Optional[str] = None,
        search_query: Optional[str] = None,
        language: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AmbientMemoryItem]:
        """Retrieves a paginated list of ambient memories with optional filters."""
        return self.storage.list_all(
            date=date,
            search_query=search_query,
            language=language,
            limit=limit,
            offset=offset
        )

    def delete_one_memory(self, memory_id: str) -> bool:
        """Deletes a single ambient memory item by ID."""
        return self.storage.delete(memory_id)

    def delete_memory(self, memory_id: str) -> bool:
        """Alias for delete_one_memory."""
        return self.delete_one_memory(memory_id)

    def delete_memories_by_time_range(self, date_str: str, start_time: str, end_time: str) -> int:
        """Deletes all ambient memories within a time range on a date."""
        return self.storage.delete_by_time_range(
            date_str=date_str,
            start_time=start_time,
            end_time=end_time
        )

    def delete_all_ambient_memory_data(self) -> int:
        """Clears all stored ambient memory records."""
        return self.storage.delete_all()

    def delete_all_memories(self) -> int:
        """Alias for delete_all_ambient_memory_data."""
        return self.delete_all_ambient_memory_data()

    def search_memory(
        self,
        start_datetime: Optional[str] = None,
        end_datetime: Optional[str] = None,
        date: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        topic: Optional[str] = None,
        natural_query: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        order_asc: bool = True
    ) -> Dict[str, Any]:
        """
        Unified search interface for retrieving ambient memories with natural time expressions,
        exact date/time windows, and keyword/topic filtering in chronological order.
        """
        from backend.ambient_memory.retrieval import ambient_retrieval
        return ambient_retrieval.search_memory(
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            date=date,
            start_time=start_time,
            end_time=end_time,
            topic=topic,
            natural_query=natural_query,
            limit=limit,
            offset=offset,
            order_asc=order_asc
        )

    def get_recent_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves recent ambient memory episodes in chronological order."""
        from backend.ambient_memory.retrieval import ambient_retrieval
        return ambient_retrieval.get_recent_memories(limit=limit)

    def get_stats(self) -> Dict[str, Any]:
        """Returns storage metrics and configuration status."""
        total = self.storage.count()
        dates = self.storage.get_distinct_dates()
        return {
            "total_records": total,
            "dates_recorded": len(dates),
            "available_dates": dates,
            "enabled": self.config.enabled,
            "retention_days": self.config.retention_days,
            "max_records": self.config.max_records
        }

ambient_engine = AmbientMemoryEngine()
