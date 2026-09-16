import os
import sys
import json
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import HOST, PORT, DEBUG, PROJECT_ROOT
from backend.api import api_router
from backend.system.metrics import get_system_metrics
from backend.assistant.notification_center import notification_center
from backend.memory.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("jarvis.main")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

async def background_telemetry_loop():
    """Broadcasts real-time telemetry every 2 seconds to connected clients"""
    logger.info("Starting background telemetry loop.")
    while True:
        try:
            if manager.active_connections:
                metrics = get_system_metrics()
                notifs = notification_center.get_pending_notifications()
                payload = {
                    "type": "TELEMETRY_UPDATE",
                    "metrics": metrics,
                    "notifications": notifs,
                    "timestamp": metrics.get("os", {}).get("name", "")
                }
                await manager.broadcast(payload)
        except Exception as e:
            logger.debug(f"Telemetry broadcast error: {e}")
        await asyncio.sleep(2.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("  JARVIS v3.0 — Mark-III Sovereign  |  ONLINE")
    logger.info("  Autonomous AI Core | All Subsystems Initializing")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    init_db()
    telemetry_task = asyncio.create_task(background_telemetry_loop())
    logger.info("[OK] Database schema initialized.")
    logger.info("[OK] Background telemetry loop started.")
    logger.info("[OK] JARVIS v3.0 Sovereign is standing by.")
    yield
    # Shutdown
    telemetry_task.cancel()
    logger.info("JARVIS v3.0 Sovereign — Graceful shutdown complete.")

app = FastAPI(
    title="JARVIS v3.0 Autonomous AI Core (Mark-III Sovereign)",
    version="3.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API endpoints
app.include_router(api_router)

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG"})
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket connection closed with error: {e}")
        manager.disconnect(websocket)

# Disable browser caching for SPA assets during development / dynamic updates
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Serve built frontend if dist exists
dist_dir = PROJECT_ROOT / "dist"
if dist_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(dist_dir / "assets")), name="assets")
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            resp = FileResponse(str(file_path))
        else:
            resp = FileResponse(str(dist_dir / "index.html"))
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        resp.headers["Pragma"] = "no-cache"
        resp.headers["Expires"] = "0"
        return resp

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        access_log=False
    )
