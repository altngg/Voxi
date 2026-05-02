from fastapi import APIRouter, HTTPException
from schemas.test_chat import TestChatRequest, TestChatResponse
from clients.ollama_client import OllamaClient
import traceback

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/generate", response_model=TestChatResponse)
async def generate(req: TestChatRequest):
    try:
        response_text = await OllamaClient().generate(
            prompt=req.prompt,
        )
        return TestChatResponse(response=response_text)
    
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    