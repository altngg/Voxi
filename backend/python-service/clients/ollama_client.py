from typing import List, Optional, Dict, Any
from core.config import settings
import httpx


class OllamaClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 120.0):
        self.base_url = base_url or settings.ollama_url
        self.timeout = timeout
        self._client = httpx.AsyncClient(timeout=timeout)

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = settings.ollama_model,
        format: Optional[str] = "json",
        required: Optional[List[str]] = None) -> str:
        payload: Dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "format": format,
            "required": required,
        }

        url = f"{self.base_url}/api/generate"

        response = await self._client.post(url, json=payload)
        response.raise_for_status()

        data = response.json()

        return data.get("response", "")

    async def close(self):
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()