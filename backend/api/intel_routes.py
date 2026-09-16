import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

from backend.tools.live_data_tools import get_live_weather, get_live_crypto_and_fx, get_live_tech_news
from backend.tools.web_search import wikipedia_lookup, web_search
from backend.intelligence.briefing_engine import briefing_engine
from backend.intelligence.vision_engine import vision_engine
from backend.intelligence.radar_engine import radar_engine
from backend.system.macro_engine import macro_engine

logger = logging.getLogger("jarvis.api.intel")
router = APIRouter(prefix="/intel", tags=["intel"])

@router.get("/radar/scan")
def handle_radar_scan(location: Optional[str] = None):
    """Executes a geospatial radar scan for the requested or detected user area."""
    return radar_engine.scan_location_radar(location_query=location)

class ScreenAnalysisRequest(BaseModel):
    query: Optional[str] = "Analyze and summarize the contents of this display"

class CameraAnalysisRequest(BaseModel):
    image_base64: str
    query: Optional[str] = "Describe what you see in front of the camera"
    language: Optional[str] = "auto"
    continuous: Optional[bool] = False

class MacroExecuteRequest(BaseModel):
    macro_id: str
    params: Optional[Dict[str, Any]] = None

@router.get("/briefing")
def handle_tactical_briefing(location: str = "Dhaka", language: str = "auto"):
    """Generates an executive tactical briefing dossier and audio script."""
    return briefing_engine.generate_tactical_briefing(location=location, language=language)

@router.post("/analyze-screen")
def handle_screen_analysis(req: ScreenAnalysisRequest):
    """Captures the active display and executes AI vision inspection."""
    return vision_engine.analyze_current_screen(user_query=req.query or "Analyze screen")

@router.post("/camera/analyze")
def handle_camera_analysis(req: CameraAnalysisRequest):
    """Processes a live camera frame and performs AI optical perception."""
    return vision_engine.analyze_camera_frame(
        image_base64=req.image_base64,
        user_query=req.query or "Describe what you see in front of the camera",
        language=req.language or "auto",
        continuous=req.continuous or False
    )

@router.get("/camera/status")
def handle_camera_status():
    """Returns the latest optical awareness and camera state."""
    return {
        "camera_active": vision_engine.camera_active,
        "latest_observation": vision_engine.latest_camera_observation
    }

@router.get("/macros")
def handle_get_macros():
    """Lists available autonomous macro presets."""
    return {"macros": macro_engine.get_available_macros()}

@router.post("/macros/execute")
def handle_execute_macro(req: MacroExecuteRequest):
    """Executes an autonomous macro workflow."""
    return macro_engine.execute_macro(macro_id=req.macro_id, params=req.params)

@router.get("/weather")
async def handle_weather(location: str = "Dhaka"):
    return get_live_weather(location=location)

@router.get("/crypto-fx")
async def handle_crypto_fx():
    return get_live_crypto_and_fx()

@router.get("/tech-news")
async def handle_tech_news(limit: int = 5):
    return get_live_tech_news(limit=limit)

class AnalyzeNewsRequest(BaseModel):
    story_title: Optional[str] = None
    category: Optional[str] = None

@router.get("/bangladesh-news")
async def handle_bangladesh_news(limit: int = 8, force_refresh: bool = False):
    """Fetches real-time Bangladesh breaking news and trending headlines."""
    from backend.tools.bangladesh_news import get_bangladesh_breaking_news
    return get_bangladesh_breaking_news(limit=limit, force_refresh=force_refresh)

@router.post("/bangladesh-news/analyze")
async def handle_analyze_bangladesh_news(req: Optional[AnalyzeNewsRequest] = None):
    """Generates real-time multi-agent office discussion turns for Bangladesh hot news."""
    from backend.tools.bangladesh_news import generate_multi_agent_news_discussion
    story = req.story_title if req else None
    cat = req.category if req else None
    return generate_multi_agent_news_discussion(story_title=story, category=cat)

@router.get("/wiki")
async def handle_wiki(query: str):
    res = wikipedia_lookup(query=query)
    return {"query": query, "result": res}

@router.get("/web-search")
async def handle_web_search(query: str, max_results: int = 5):
    res = web_search(query=query, max_results=max_results)
    return {"query": query, "result": res}


