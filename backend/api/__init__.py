"""JARVIS v2.0 — API Router Registry"""
from fastapi import APIRouter
from backend.api.routes import router as core_router
from backend.api.credentials import router as credentials_router
from backend.api.memory_routes import router as memory_router
from backend.api.assistant_routes import router as assistant_router
from backend.api.communication_routes import router as communication_router
from backend.api.smart_home_routes import router as smart_home_router
from backend.api.agent_routes import router as agent_router
from backend.api.system_routes import router as system_router
from backend.api.user_tasks_routes import router as user_tasks_router
from backend.api.conversations_routes import router as conversations_router
from backend.api.data_routes import router as data_router
from backend.api.voice_routes import router as voice_router
from backend.api.developer_routes import router as developer_router
from backend.api.intel_routes import router as intel_router

# V2 New Routes
from backend.api.stream_routes import router as stream_router
from backend.api.knowledge_routes import router as knowledge_router
from backend.api.profile_routes import router as profile_router
from backend.api.ambient_routes import router as ambient_router

api_router = APIRouter(prefix="/api")

# V1 Core Routes
api_router.include_router(core_router)
api_router.include_router(credentials_router)
api_router.include_router(memory_router)
api_router.include_router(assistant_router)
api_router.include_router(communication_router)
api_router.include_router(smart_home_router)
api_router.include_router(agent_router)
api_router.include_router(system_router)
api_router.include_router(user_tasks_router)
api_router.include_router(conversations_router)
api_router.include_router(data_router)
api_router.include_router(voice_router)
api_router.include_router(developer_router)
api_router.include_router(intel_router)

# V2 New Routes
api_router.include_router(stream_router)
api_router.include_router(knowledge_router)
api_router.include_router(profile_router)
api_router.include_router(ambient_router)

__all__ = ["api_router"]
