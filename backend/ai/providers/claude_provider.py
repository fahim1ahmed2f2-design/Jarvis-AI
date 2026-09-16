import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.ai.providers.base import BaseLLMProvider

logger = logging.getLogger("jarvis.provider.claude")

class ClaudeProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-7-sonnet-20250219"):
        super().__init__(api_key, model)
        self.endpoint = "https://api.anthropic.com/v1/messages"

    def generate_chat(self, messages: List[Dict[str, str]], system_prompt: str, temperature: float = 0.7) -> str:
        if not self.api_key:
            raise ValueError("Anthropic API Key is missing.")

        payload_messages = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "assistant"
            payload_messages.append({"role": role, "content": m.get("content", "")})

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model or "claude-3-7-sonnet-20250219",
            "system": system_prompt,
            "messages": payload_messages,
            "max_tokens": 4096,
            "temperature": temperature
        }

        with httpx.Client(timeout=30.0) as client:
            res = client.post(self.endpoint, headers=headers, json=payload)
            if res.status_code != 200:
                err = res.json().get("error", {})
                raise RuntimeError(err.get("message", f"Claude API Error {res.status_code}"))
            data = res.json()
            return data["content"][0]["text"]

    def test_connection(self) -> Dict[str, Any]:
        try:
            reply = self.generate_chat([{"role": "user", "content": "Ping test: respond with 'PONG'"}], system_prompt="Be concise.")
            return {"success": True, "message": f"Connected successfully to Claude ({self.model})", "model_id": self.model}
        except Exception as e:
            return {"success": False, "message": str(e), "model_id": self.model}
