import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.ai.providers.base import BaseLLMProvider

logger = logging.getLogger("jarvis.provider.groq")

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.3-70b-versatile"):
        super().__init__(api_key, model)
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def generate_chat(self, messages: List[Dict[str, str]], system_prompt: str, temperature: float = 0.7) -> str:
        if not self.api_key:
            raise ValueError("Groq API Key is missing.")

        payload_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            payload_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model or "llama-3.3-70b-versatile",
            "messages": payload_messages,
            "temperature": temperature
        }

        with httpx.Client(timeout=25.0) as client:
            res = client.post(self.endpoint, headers=headers, json=payload)
            if res.status_code != 200:
                err = res.json().get("error", {})
                raise RuntimeError(err.get("message", f"Groq API Error {res.status_code}"))
            data = res.json()
            return data["choices"][0]["message"]["content"]

    def test_connection(self) -> Dict[str, Any]:
        try:
            reply = self.generate_chat([{"role": "user", "content": "Ping test: respond with 'PONG'"}], system_prompt="Be concise.")
            return {"success": True, "message": f"Connected successfully to Groq ({self.model})", "model_id": self.model}
        except Exception as e:
            return {"success": False, "message": str(e), "model_id": self.model}
