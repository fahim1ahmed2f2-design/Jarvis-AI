import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.ai.providers.base import BaseLLMProvider

logger = logging.getLogger("jarvis.provider.gemini")

GEMINI_FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-pro-latest",
    "gemini-3.7-flash"
]

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-3.5-flash-lite"):
        super().__init__(api_key, model or "gemini-3.5-flash-lite")

    def generate_chat(self, messages: List[Dict[str, str]], system_prompt: str, temperature: float = 0.7) -> str:
        if not self.api_key:
            raise ValueError("Gemini API Key is missing.")

        primary_model = self.model or "gemini-3.5-flash-lite"
        # Build candidate list starting with primary model
        models_to_try = [primary_model]
        for fb in GEMINI_FALLBACK_MODELS:
            if fb not in models_to_try:
                models_to_try.append(fb)

        contents = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m.get("content", "")}]
            })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 4096
            }
        }

        headers = {"Content-Type": "application/json"}
        last_error = None

        for current_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=12.0) as client:
                    res = client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and candidates[0].get("content", {}).get("parts"):
                            return candidates[0]["content"]["parts"][0]["text"]
                    
                    # If not 200, capture error and try next model
                    err_data = {}
                    try:
                        err_data = res.json().get("error", {})
                    except Exception:
                        pass
                    msg = err_data.get("message", f"HTTP {res.status_code}")
                    last_error = f"{current_model}: {msg}"
                    logger.warning(f"Gemini model {current_model} returned {res.status_code} ({msg}). Trying fallback...")
            except Exception as e:
                last_error = f"{current_model}: {str(e)}"
                logger.warning(f"Gemini model {current_model} connection error: {e}. Trying fallback...")

        raise RuntimeError(f"All Gemini models exhausted. Last error: {last_error}")

    def test_connection(self) -> Dict[str, Any]:
        try:
            reply = self.generate_chat([{"role": "user", "content": "Ping test: respond with 'PONG'"}], system_prompt="Be concise.")
            return {"success": True, "message": f"Connected successfully to Gemini ({self.model})", "model_id": self.model}
        except Exception as e:
            return {"success": False, "message": str(e), "model_id": self.model}

