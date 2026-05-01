from fastapi import APIRouter
from .test_chat import router as test_chat_router

router = APIRouter()

router.include_router(test_chat_router, prefix="/test-chat", tags=["test-chatsssss"])