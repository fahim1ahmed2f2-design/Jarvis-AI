from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.smart_home.device_manager import smart_device_manager
from backend.smart_home.google_home import load_smart_home_config, save_smart_home_config

router = APIRouter(prefix="/smart-home", tags=["smart_home"])

class SetValueRequest(BaseModel):
    capability: str
    value: Any

class GroupControlRequest(BaseModel):
    group_type: str
    action: str
    room: Optional[str] = None

class BroadcastRequest(BaseModel):
    message: str

class ProviderRequest(BaseModel):
    provider: str

class ConfigUpdateRequest(BaseModel):
    active_provider: Optional[str] = None
    google_home: Optional[Dict[str, Any]] = None
    home_assistant: Optional[Dict[str, Any]] = None

@router.get("/devices")
def get_devices(room: Optional[str] = Query(None), type: Optional[str] = Query(None)):
    devs = smart_device_manager.get_devices(room=room, dev_type=type)
    return {
        "provider": smart_device_manager.get_active_provider(),
        "total": len(devs),
        "devices": devs
    }

@router.post("/devices/{device_id}/toggle")
def toggle_device(device_id: str):
    res = smart_device_manager.toggle_device(device_id)
    if not res:
        raise HTTPException(status_code=404, detail="Device not found.")
    return res

@router.post("/devices/{device_id}/value")
def set_device_value(device_id: str, req: SetValueRequest):
    res = smart_device_manager.set_device_value(device_id, req.capability, req.value)
    if not res:
        raise HTTPException(status_code=404, detail="Device not found.")
    return res

@router.post("/groups/control")
def control_group(req: GroupControlRequest):
    res = smart_device_manager.control_group(req.group_type, req.action, req.room)
    return res

@router.get("/rooms")
def get_rooms():
    rooms = smart_device_manager.get_rooms()
    return {"total": len(rooms), "rooms": rooms}

@router.get("/scenes")
def get_scenes():
    scenes = smart_device_manager.get_scenes()
    return {"total": len(scenes), "scenes": scenes}

@router.post("/scenes/{scene_name}/activate")
def activate_scene(scene_name: str):
    res = smart_device_manager.activate_scene(scene_name)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to activate scene."))
    return res

@router.post("/broadcast")
def broadcast_message(req: BroadcastRequest):
    res = smart_device_manager.broadcast_announcement(req.message)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Broadcast failed."))
    return res

@router.get("/config")
def get_config():
    cfg = load_smart_home_config()
    # Mask secrets
    safe_cfg = {
        "active_provider": cfg.get("active_provider", "virtual"),
        "google_home": {
            "project_id": cfg.get("google_home", {}).get("project_id", ""),
            "client_id": cfg.get("google_home", {}).get("client_id", ""),
            "has_secret": bool(cfg.get("google_home", {}).get("client_secret")),
            "has_token": bool(cfg.get("google_home", {}).get("access_token")),
            "connected": bool(cfg.get("google_home", {}).get("access_token"))
        },
        "home_assistant": {
            "host_url": cfg.get("home_assistant", {}).get("host_url", ""),
            "has_token": bool(cfg.get("home_assistant", {}).get("access_token")),
            "connected": bool(cfg.get("home_assistant", {}).get("access_token"))
        }
    }
    return safe_cfg

@router.post("/config")
def update_config(req: ConfigUpdateRequest):
    cfg = load_smart_home_config()
    if req.active_provider:
        cfg["active_provider"] = req.active_provider
    if req.google_home:
        for k, v in req.google_home.items():
            if v is not None:
                cfg.setdefault("google_home", {})[k] = v
    if req.home_assistant:
        for k, v in req.home_assistant.items():
            if v is not None:
                cfg.setdefault("home_assistant", {})[k] = v
    save_smart_home_config(cfg)
    return {"success": True, "message": "Smart Home configuration updated."}

@router.post("/provider")
def set_provider(req: ProviderRequest):
    return smart_device_manager.set_active_provider(req.provider)
