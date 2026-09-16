"""
JARVIS v2.0 — User Profile API
Manage user preferences, personalization, and profile data.
Used to personalize AI responses and system behavior.
"""
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger("jarvis.api.profile")

router = APIRouter(prefix="/profile", tags=["profile"])

# Profile storage path
from backend.config import DATA_DIR
PROFILE_FILE = DATA_DIR / "user_profile.json"

DEFAULT_PROFILE = {
    "name": "Sir",
    "display_name": "Sir",
    "language": "auto",
    "timezone": "Asia/Dhaka",
    "location": "Dhaka",
    "theme": "MARK_IV",
    "communication_style": "professional",  # formal, casual, professional
    "response_length": "auto",  # brief, auto, detailed
    "preferred_providers": [],
    "stock_tickers": ["AAPL", "GOOGL", "MSFT"],
    "github_username": "",
    "interests": [],
    "custom_wake_phrase": "JARVIS",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}


def _load_profile() -> Dict[str, Any]:
    if PROFILE_FILE.exists():
        try:
            with open(PROFILE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Merge with defaults for any missing keys
            merged = {**DEFAULT_PROFILE, **data}
            return merged
        except Exception as e:
            logger.warning(f"Error loading profile: {e}")
    return DEFAULT_PROFILE.copy()


def _save_profile(profile: Dict[str, Any]) -> None:
    profile["updated_at"] = datetime.now().isoformat()
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    location: Optional[str] = None
    theme: Optional[str] = None
    communication_style: Optional[str] = None
    response_length: Optional[str] = None
    stock_tickers: Optional[List[str]] = None
    github_username: Optional[str] = None
    interests: Optional[List[str]] = None
    custom_wake_phrase: Optional[str] = None


@router.get("")
async def get_profile():
    """Get the current user profile."""
    profile = _load_profile()
    return {
        "status": "success",
        "profile": profile
    }


@router.patch("")
async def update_profile(req: UpdateProfileRequest):
    """Update user profile fields."""
    profile = _load_profile()
    
    update_data = req.model_dump(exclude_none=True)
    
    # Validate communication_style
    if "communication_style" in update_data:
        valid_styles = ["formal", "casual", "professional"]
        if update_data["communication_style"] not in valid_styles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid communication_style. Must be one of: {valid_styles}"
            )
    
    # Validate response_length
    if "response_length" in update_data:
        valid_lengths = ["brief", "auto", "detailed"]
        if update_data["response_length"] not in valid_lengths:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid response_length. Must be one of: {valid_lengths}"
            )
    
    profile.update(update_data)
    _save_profile(profile)
    
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "profile": profile
    }


@router.post("/reset")
async def reset_profile():
    """Reset profile to defaults."""
    profile = DEFAULT_PROFILE.copy()
    profile["created_at"] = datetime.now().isoformat()
    _save_profile(profile)
    return {
        "status": "success",
        "message": "Profile reset to defaults.",
        "profile": profile
    }


@router.get("/greeting")
async def get_personalized_greeting():
    """Get a time-aware personalized greeting."""
    profile = _load_profile()
    now = datetime.now()
    hour = now.hour
    
    name = profile.get("display_name", "Sir")
    
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 17:
        time_greeting = "Good afternoon"
    elif hour < 20:
        time_greeting = "Good evening"
    else:
        time_greeting = "Good evening"
    
    greeting = f"{time_greeting}, {name}."
    
    return {
        "greeting": greeting,
        "name": name,
        "time_of_day": "morning" if hour < 12 else "afternoon" if hour < 17 else "evening",
        "location": profile.get("location", "Dhaka"),
        "language": profile.get("language", "auto")
    }
