from fastapi import APIRouter
from schemas.test_chat import TestChatRequest, TestChatResponse
from clients.ollama_client import OllamaClient

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/generate", response_model=TestChatResponse)
async def generate(req: TestChatRequest):
    response_text = await OllamaClient().generate(
        prompt=req.prompt,
        model=req.model,
    )

    return TestChatResponse(model=req.model, response=response_text)