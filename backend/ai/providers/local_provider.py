import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.ai.providers.base import BaseLLMProvider

logger = logging.getLogger("jarvis.provider.local")

class LocalOllamaProvider(BaseLLMProvider):
    def __init__(self, host: str = "http://localhost:11434", model: str = "llama3:latest"):
        super().__init__(api_key=None, model=model)
        self.host = host.rstrip("/")

    def generate_chat(self, messages: List[Dict[str, str]], system_prompt: str, temperature: float = 0.7) -> str:
        url = f"{self.host}/api/chat"
        payload_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            payload_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        payload = {
            "model": self.model or "llama3:latest",
            "messages": payload_messages,
            "stream": False,
            "options": {"temperature": temperature}
        }

        with httpx.Client(timeout=45.0) as client:
            res = client.post(url, json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Ollama API Error {res.status_code}: {res.text}")
            data = res.json()
            return data["message"]["content"]

    def test_connection(self) -> Dict[str, Any]:
        try:
            url = f"{self.host}/api/tags"
            with httpx.Client(timeout=4.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", [])]
                    return {"success": True, "message": f"Ollama is running. Available models: {', '.join(models[:3])}", "model_id": self.model}
                return {"success": False, "message": f"Ollama returned HTTP {res.status_code}", "model_id": self.model}
        except Exception as e:
            return {"success": False, "message": f"Ollama not reachable: {e}", "model_id": self.model}
