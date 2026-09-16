from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMProvider(ABC):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    def generate_chat(self, messages: List[Dict[str, str]], system_prompt: str, temperature: float = 0.7) -> str:
        """
        Synchronous chat generation.
        """
        pass

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Tests whether the API key and endpoint are working.
        """
        pass
