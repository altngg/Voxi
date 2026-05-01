from pydantic import BaseModel
from typing import Optional


class TestChatRequest(BaseModel):
    prompt: str
    model: Optional[str] = None


class TestChatResponse(BaseModel):
    model: str
    response: str