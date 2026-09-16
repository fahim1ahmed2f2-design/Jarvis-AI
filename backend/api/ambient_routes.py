from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from backend.ambient_memory.engine import ambient_engine
from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.listener import ambient_listener
from backend.ambient_memory.processor import ambient_pipeline
from backend.ambient_memory.time_parser import natural_time_parser
from backend.ambient_memory.retrieval import ambient_retrieval
from backend.ambient_memory.config import ambient_config

router = APIRouter(prefix="/ambient", tags=["ambient_memory"])

class CreateAmbientMemoryRequest(BaseModel):
    transcript: str = Field(..., description="Transcript of the ambient memory episode")
    date: Optional[str] = Field(None, description="Date in YYYY-MM-DD format")
    start_time: Optional[str] = Field(None, description="Start time (HH:MM:SS or ISO)")
    end_time: Optional[str] = Field(None, description="End time (HH:MM:SS or ISO)")
    language: Optional[str] = Field("auto", description="Language code")
    confidence: Optional[float] = Field(1.0, description="Confidence level (0.0 to 1.0)")
    audio_reference: Optional[str] = Field(None, description="Reference path or identifier to audio")
    status: Optional[str] = Field("processed", description="Processing status")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom metadata tags")

class SearchAmbientMemoryRequest(BaseModel):
    natural_query: Optional[str] = Field(None, description="Natural language search expression (e.g. 'আজ দুপুর ২টা থেকে ৩টা')")
    date: Optional[str] = Field(None, description="Date (YYYY-MM-DD)")
    start_time: Optional[str] = Field(None, description="Start time (HH:MM:SS)")
    end_time: Optional[str] = Field(None, description="End time (HH:MM:SS)")
    topic: Optional[str] = Field(None, description="Keyword or topic")
    limit: Optional[int] = Field(50, ge=1, le=500)
    offset: Optional[int] = Field(0, ge=0)

class ParseTimeRequest(BaseModel):
    text: str = Field(..., description="Temporal expression to parse")

class UpdateAmbientConfigRequest(BaseModel):
    enabled: Optional[bool] = Field(None, description="Enable or disable Ambient Memory")
    paused: Optional[bool] = Field(None, description="Pause or resume ambient listening")
    save_audio: Optional[bool] = Field(None, description="Save raw speech audio snippet alongside transcript")
    retention_days: Optional[int] = Field(None, description="Retention duration in days (0 for forever)")
    default_language: Optional[str] = Field(None, description="Default language code")

# ── General Status & Configuration ─────────────────────────────────────────────

@router.get("/status")
def get_ambient_status():
    """Returns the operational status and statistics of the Ambient Memory module."""
    stats = ambient_engine.get_stats()
    pipeline_status = ambient_pipeline.get_status()
    return {
        "status": "online",
        "module": "Ambient Memory",
        "version": "1.5.0",
        "stats": stats,
        "config": ambient_config.to_dict(),
        "pipeline": pipeline_status
    }

@router.get("/config")
def get_ambient_config():
    """Retrieves current persistent Ambient Memory configuration."""
    return ambient_config.to_dict()

@router.post("/config")
def update_ambient_config(req: UpdateAmbientConfigRequest):
    """Updates and persists Ambient Memory settings."""
    updated = ambient_config.update(
        enabled=req.enabled,
        paused=req.paused,
        save_audio=req.save_audio,
        retention_days=req.retention_days,
        default_language=req.default_language
    )
    if req.enabled is True and not ambient_pipeline.is_running:
        ambient_pipeline.start()
    elif req.enabled is False and ambient_pipeline.is_running:
        ambient_pipeline.stop()

    return {
        "status": "success",
        "config": updated,
        "pipeline": ambient_pipeline.get_status()
    }

# ── Memory Search & Retrieval Endpoints ────────────────────────────────────────

@router.post("/search")
def search_ambient_memories_post(req: SearchAmbientMemoryRequest):
    """
    Unified search endpoint accepting natural queries, exact date/time filters, and topic keywords.
    """
    return ambient_retrieval.search_memory(
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        topic=req.topic,
        natural_query=req.natural_query,
        limit=req.limit or 50,
        offset=req.offset or 0
    )

@router.get("/search")
def search_ambient_memories_get(
    natural_query: Optional[str] = Query(None, description="Natural query in Bengali or English"),
    date: Optional[str] = Query(None, description="Exact date (YYYY-MM-DD)"),
    start_time: Optional[str] = Query(None, description="Start time (HH:MM:SS)"),
    end_time: Optional[str] = Query(None, description="End time (HH:MM:SS)"),
    topic: Optional[str] = Query(None, description="Topic keyword"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """GET query endpoint for ambient search."""
    return ambient_retrieval.search_memory(
        date=date,
        start_time=start_time,
        end_time=end_time,
        topic=topic,
        natural_query=natural_query,
        limit=limit,
        offset=offset
    )

@router.post("/parse_time")
def parse_natural_time_endpoint(req: ParseTimeRequest):
    """Inspects natural language temporal extraction."""
    return natural_time_parser.parse(req.text)

@router.get("/recent")
def get_recent_ambient_memories_endpoint(limit: int = Query(10, ge=1, le=50)):
    """Retrieves recent ambient memories in chronological order."""
    mems = ambient_retrieval.get_recent_memories(limit=limit)
    return {
        "total": len(mems),
        "memories": mems
    }

# ── Full Ambient Pipeline Controls (Mic -> VAD -> Async STT -> Storage) ───────

@router.get("/pipeline/status")
def get_pipeline_status():
    """Returns the real-time status of the asynchronous Ambient Memory pipeline."""
    return ambient_pipeline.get_status()

@router.post("/pipeline/start")
def start_pipeline():
    """Starts the full ambient stream pipeline."""
    success = ambient_pipeline.start()
    return {
        "status": "started" if success else "failed",
        "pipeline": ambient_pipeline.get_status()
    }

@router.post("/pipeline/pause")
def pause_pipeline():
    """Pauses ambient memory listening and processing."""
    ambient_pipeline.pause()
    return {
        "status": "paused",
        "pipeline": ambient_pipeline.get_status()
    }

@router.post("/pipeline/resume")
def resume_pipeline():
    """Resumes ambient memory listening and processing."""
    ambient_pipeline.resume()
    return {
        "status": "resumed",
        "pipeline": ambient_pipeline.get_status()
    }

@router.post("/pipeline/stop")
def stop_pipeline():
    """Stops the ambient stream pipeline and flushes pending transcriptions."""
    ambient_pipeline.stop()
    return {
        "status": "stopped",
        "pipeline": ambient_pipeline.get_status()
    }

# ── Microphone Listener & VAD Controls (Internal ON/OFF) ───────────────────────

@router.get("/listener/status")
def get_listener_status():
    """Returns the real-time status of the Ambient Microphone Listener and VAD."""
    return ambient_listener.get_status()

@router.post("/listener/start")
def start_listener():
    """Starts background microphone listening and Voice Activity Detection."""
    success = ambient_listener.start()
    status = ambient_listener.get_status()
    if not success:
        return {
            "status": "failed",
            "message": status.get("last_error") or "Could not start microphone listener.",
            "listener": status
        }
    return {
        "status": "started",
        "message": "Ambient microphone listener and VAD active in background.",
        "listener": status
    }

@router.post("/listener/stop")
def stop_listener():
    """Stops background microphone listening and VAD."""
    ambient_listener.stop()
    return {
        "status": "stopped",
        "message": "Ambient microphone listener stopped.",
        "listener": ambient_listener.get_status()
    }

@router.get("/listener/segments")
def get_recent_speech_segments(limit: int = Query(20, ge=1, le=50)):
    """Returns recently detected speech segments with timestamps."""
    segments = ambient_listener.get_recent_segments(limit=limit)
    return {
        "total": len(segments),
        "segments": segments
    }

@router.delete("/listener/segments")
def clear_recent_speech_segments():
    """Clears the in-memory recent speech segments buffer."""
    ambient_listener.clear_recent_segments()
    return {
        "status": "cleared",
        "message": "Recent speech segments buffer cleared."
    }

# ── Memory Storage, Range Queries & CRUD ───────────────────────────────────────

@router.get("/memories")
def list_ambient_memories(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Keyword search in transcript"),
    language: Optional[str] = Query(None, description="Filter by language"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Retrieves stored ambient memories with optional search and date filters."""
    items = ambient_engine.retrieve_all_memories(
        date=date,
        search_query=search,
        language=language,
        limit=limit,
        offset=offset
    )
    return {
        "total": len(items),
        "memories": [item.to_dict() for item in items]
    }

@router.get("/memories/range")
def get_memories_in_time_range(
    date: str = Query(..., description="Date (YYYY-MM-DD)"),
    start_time: str = Query(..., description="Start time (HH:MM:SS)"),
    end_time: str = Query(..., description="End time (HH:MM:SS)"),
    limit: int = Query(200, ge=1, le=500)
):
    """Retrieves ambient memories within a specific time range on a date."""
    items = ambient_engine.get_memories_by_time_range(
        date_str=date,
        start_time=start_time,
        end_time=end_time,
        limit=limit
    )
    return {
        "date": date,
        "start_time": start_time,
        "end_time": end_time,
        "total": len(items),
        "memories": [item.to_dict() for item in items]
    }

@router.get("/memories/date/{date_str}")
def get_memories_by_specific_date(
    date_str: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Retrieves all ambient memories recorded on a specific date."""
    items = ambient_engine.get_memories_by_date(date_str, limit=limit, offset=offset)
    return {
        "date": date_str,
        "total": len(items),
        "memories": [item.to_dict() for item in items]
    }

@router.delete("/memories/range")
def delete_memories_in_time_range(
    date: str = Query(..., description="Date (YYYY-MM-DD)"),
    start_time: str = Query(..., description="Start time (HH:MM:SS)"),
    end_time: str = Query(..., description="End time (HH:MM:SS)")
):
    """Deletes ambient memories within a specific time range on a date."""
    count = ambient_engine.delete_memories_by_time_range(
        date_str=date,
        start_time=start_time,
        end_time=end_time
    )
    return {
        "status": "success",
        "deleted_count": count,
        "message": f"Deleted {count} ambient memories in range {start_time} - {end_time} on {date}."
    }

@router.post("/memories")
def create_ambient_memory(req: CreateAmbientMemoryRequest):
    """Manually creates and saves a new ambient memory item."""
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    item = ambient_engine.add_memory(
        transcript=req.transcript,
        date=req.date,
        start_time=req.start_time,
        end_time=req.end_time,
        language=req.language or "auto",
        confidence=req.confidence if req.confidence is not None else 1.0,
        audio_reference=req.audio_reference,
        status=req.status or "processed",
        metadata=req.metadata or {}
    )
    return {
        "status": "success",
        "memory": item.to_dict()
    }

@router.get("/memories/{memory_id}")
def get_ambient_memory_item(memory_id: str):
    """Retrieves a single ambient memory item by ID."""
    item = ambient_engine.get_memory_by_id(memory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ambient memory record not found.")
    return {
        "status": "success",
        "memory": item.to_dict()
    }

@router.delete("/memories/{memory_id}")
def delete_ambient_memory_item(memory_id: str):
    """Deletes an ambient memory item by ID."""
    deleted = ambient_engine.delete_one_memory(memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ambient memory record not found.")
    return {
        "status": "success",
        "deleted": True,
        "id": memory_id
    }

@router.delete("/memories")
def delete_all_ambient_memories():
    """Clears all ambient memory records."""
    count = ambient_engine.delete_all_ambient_memory_data()
    return {
        "status": "success",
        "deleted_count": count,
        "message": f"Cleared {count} ambient memories."
    }
