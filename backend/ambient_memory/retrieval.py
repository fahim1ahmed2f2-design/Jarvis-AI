import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.storage import AmbientMemoryStorage, ambient_storage
from backend.ambient_memory.time_parser import NaturalTimeParser, natural_time_parser

logger = logging.getLogger("jarvis.ambient_memory.retrieval")

class AmbientRetrievalEngine:
    """
    Dedicated Retrieval and Time-Based Search Service for Ambient Memory.
    
    Capabilities:
    1. Exact date search (YYYY-MM-DD)
    2. Exact time-range search (HH:MM:SS -> HH:MM:SS)
    3. Combined Date + Time-Range search
    4. Natural Language Bengali / English temporal query parsing
    5. Topic / Keyword filtering
    6. Combined Temporal + Topic search
    7. Chronological ordering (earliest -> latest)
    8. Safe non-guessing ambiguity handling
    9. Memory-efficient chunked / paginated retrieval
    """

    def __init__(
        self,
        storage: Optional[AmbientMemoryStorage] = None,
        time_parser: Optional[NaturalTimeParser] = None
    ):
        self.storage = storage or ambient_storage
        self.time_parser = time_parser or natural_time_parser

    def search_memory(
        self,
        start_datetime: Optional[str] = None,
        end_datetime: Optional[str] = None,
        date: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        topic: Optional[str] = None,
        natural_query: Optional[str] = None,
        ref_datetime: Optional[datetime] = None,
        limit: int = 50,
        offset: int = 0,
        order_asc: bool = True
    ) -> Dict[str, Any]:
        """
        Primary search interface for retrieving ambient memories.
        
        Guarantees:
        - Strict chronological ordering.
        - Never invents transcript content.
        - Preserves uncertainty and confidence metrics.
        - Flags ambiguous time queries without guessing.
        """
        filter_date = date
        filter_start_time = start_time
        filter_end_time = end_time
        filter_topic = topic
        is_ambiguous = False
        ambiguity_reason = None

        # 1. Parse start_datetime / end_datetime if supplied in ISO format
        if start_datetime and " " in start_datetime:
            p_date, p_time = start_datetime.split(" ", 1)
            filter_date = filter_date or p_date
            filter_start_time = filter_start_time or p_time
        if end_datetime and " " in end_datetime:
            p_date, p_time = end_datetime.split(" ", 1)
            filter_date = filter_date or p_date
            filter_end_time = filter_end_time or p_time

        # 2. Parse Natural Language Time Query if provided
        if natural_query and natural_query.strip():
            parsed = self.time_parser.parse(natural_query, ref_datetime=ref_datetime)
            if parsed.get("is_ambiguous"):
                is_ambiguous = True
                ambiguity_reason = parsed.get("ambiguity_reason")

            if parsed.get("date"):
                filter_date = filter_date or parsed["date"]
            if parsed.get("start_time"):
                filter_start_time = filter_start_time or parsed["start_time"]
            if parsed.get("end_time"):
                filter_end_time = filter_end_time or parsed["end_time"]
            if parsed.get("topic") and not filter_topic:
                filter_topic = parsed["topic"]

        # If query is explicitly ambiguous and lacks concrete constraints, return early
        if is_ambiguous and not filter_date and not filter_start_time:
            return {
                "success": False,
                "is_ambiguous": True,
                "ambiguity_reason": ambiguity_reason or "Time reference is ambiguous.",
                "total_found": 0,
                "count": 0,
                "memories": [],
                "message": f"Ambiguous time query: {ambiguity_reason}"
            }

        # 3. Execute Search on Persistent Storage
        records = self.storage.search_memories(
            date=filter_date,
            start_time=filter_start_time,
            end_time=filter_end_time,
            topic=filter_topic,
            limit=limit,
            offset=offset,
            order_asc=order_asc
        )

        formatted_memories = [item.to_dict() for item in records]

        msg = f"Retrieved {len(formatted_memories)} ambient memory record(s)."
        if not formatted_memories:
            msg = "No matching ambient memories found for the specified criteria."

        return {
            "success": True,
            "is_ambiguous": False,
            "total_found": len(formatted_memories),
            "count": len(formatted_memories),
            "filters_applied": {
                "date": filter_date,
                "start_time": filter_start_time,
                "end_time": filter_end_time,
                "topic": filter_topic,
                "limit": limit,
                "offset": offset
            },
            "memories": formatted_memories,
            "message": msg
        }

    def get_recent_memories(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves the most recent ambient memory episodes in chronological order.
        """
        records = self.storage.search_memories(
            limit=limit,
            offset=0,
            order_asc=False
        )
        # Re-sort to chronological ascending for reading convenience
        records.reverse()
        return [r.to_dict() for r in records]

ambient_retrieval = AmbientRetrievalEngine()
