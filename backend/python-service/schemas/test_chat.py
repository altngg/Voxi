from pydantic import BaseModel


class TestChatRequest(BaseModel):
    prompt: str


class TestChatResponse(BaseModel):
    response: str