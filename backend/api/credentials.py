from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.ai.brain import jarvis_brain

router = APIRouter(prefix="/credentials", tags=["credentials"])

class SaveKeyRequest(BaseModel):
    api_key: str

class SetActiveProviderRequest(BaseModel):
    provider: str
    model: Optional[str] = None

@router.get("/providers/status")
def get_providers_status():
    return jarvis_brain.get_all_providers_status()

@router.post("/providers/{provider}/save")
def save_provider_key(provider: str, req: SaveKeyRequest):
    try:
        jarvis_brain.set_provider_key(provider, req.api_key)
        return {"success": True, "message": f"API key for '{provider}' saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/providers/{provider}")
def delete_provider_key(provider: str):
    jarvis_brain.remove_provider_key(provider)
    return {"success": True, "message": f"API key for '{provider}' removed."}

@router.post("/providers/{provider}/test")
def test_provider_connection(provider: str):
    instance = jarvis_brain.get_provider_instance(provider)
    if not instance:
        raise HTTPException(status_code=400, detail=f"Provider '{provider}' not found or not initialized.")
    res = instance.test_connection()
    return res

@router.post("/active-provider")
def set_active_provider(req: SetActiveProviderRequest):
    try:
        jarvis_brain.set_active_provider(req.provider, req.model)
        return {"success": True, "message": f"Active AI provider changed to '{req.provider}' ({jarvis_brain.active_model_name})."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Backward compatibility routes for OpenAI
@router.get("/openai/status")
def get_openai_status():
    status = jarvis_brain.get_all_providers_status()
    oa = status["providers"].get("openai", {})
    return {
        "configured": oa.get("configured", False),
        "masked_key": oa.get("masked_key"),
        "key_prefix": oa.get("key_prefix")
    }

@router.post("/openai/save")
def save_openai_key(req: SaveKeyRequest):
    return save_provider_key("openai", req)

@router.delete("/openai")
def delete_openai_key():
    return delete_provider_key("openai")

@router.post("/openai/test")
def test_openai_connection():
    return test_provider_connection("openai")
