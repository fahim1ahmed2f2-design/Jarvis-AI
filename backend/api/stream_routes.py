"""
JARVIS v2.0 — Streaming Response API (SSE)
Provides real-time character-by-character AI response streaming via Server-Sent Events.
"""
import json
import logging
import asyncio
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger("jarvis.api.stream")

router = APIRouter(prefix="/stream", tags=["streaming"])


class StreamChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    mode: str = "auto"
    model_override: Optional[str] = None


async def _generate_sse_stream(
    message: str,
    session_id: str,
    mode: str,
    model_override: Optional[str]
) -> AsyncGenerator[str, None]:
    """
    Core SSE generator: calls brain.process_chat in a thread, then streams
    the resulting reply token-by-token with SSE formatting.
    """
    from backend.ai.brain import jarvis_brain

    try:
        # Send initial event: thinking started
        yield f"data: {json.dumps({'type': 'status', 'status': 'THINKING', 'message': 'Initializing neural core...'})}\n\n"
        await asyncio.sleep(0.01)

        # Run brain processing in thread pool (it's sync)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: jarvis_brain.process_chat(
                user_message=message,
                session_id=session_id,
                mode=mode,
                model_override=model_override
            )
        )

        # Stream execution steps first
        steps = result.get("steps", [])
        for step in steps:
            yield f"data: {json.dumps({'type': 'step', 'step': step})}\n\n"
            await asyncio.sleep(0.04)

        # Send metadata
        meta_payload = {
            "type": "meta",
            "intent": result.get("intent"),
            "model_used": result.get("model_used"),
            "mode_used": result.get("mode_used"),
            "route_reason": result.get("route_reason"),
            "sources": result.get("sources", [])
        }
        yield f"data: {json.dumps(meta_payload)}\n\n"
        await asyncio.sleep(0.01)

        # Stream reply text character by character (in chunks for performance)
        reply_text = result.get("reply", "")
        chunk_size = 4  # stream 4 chars at a time for smoothness

        for i in range(0, len(reply_text), chunk_size):
            chunk = reply_text[i:i + chunk_size]
            yield f"data: {json.dumps({'type': 'token', 'token': chunk})}\n\n"
            await asyncio.sleep(0.008)  # ~125 chunks/sec = very smooth

        # Send completion event
        yield f"data: {json.dumps({'type': 'done', 'status': result.get('status', 'success')})}\n\n"

    except Exception as e:
        logger.error(f"[SSE Stream] Error: {e}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'status': 'error'})}\n\n"


@router.post("/chat")
async def stream_chat(req: StreamChatRequest, request: Request):
    """
    SSE endpoint for streaming JARVIS chat responses.
    Frontend connects and receives:
    - status events (THINKING, EXECUTING)
    - step events (reasoning chain steps)
    - meta event (model, intent, sources)
    - token events (partial reply text)
    - done event (completion signal)
    """
    async def event_stream():
        async for chunk in _generate_sse_stream(
            message=req.message,
            session_id=req.session_id,
            mode=req.mode,
            model_override=req.model_override
        ):
            # Check if client disconnected
            if await request.is_disconnected():
                logger.info("[SSE Stream] Client disconnected, aborting.")
                break
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.get("/ping")
async def stream_ping():
    """Test SSE connectivity with a simple ping stream."""
    async def ping_gen():
        for i in range(3):
            yield f"data: {json.dumps({'type': 'ping', 'count': i+1})}\n\n"
            await asyncio.sleep(0.2)
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(ping_gen(), media_type="text/event-stream")
