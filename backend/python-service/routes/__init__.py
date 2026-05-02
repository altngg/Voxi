from fastapi import APIRouter

from .test_chat import router as test_chat_router
from .test_results import router as test_results_router

router = APIRouter()

router.include_router(test_chat_router, prefix="/test-chat", tags=["test-chatsssss"])
router.include_router(test_results_router, tags=["test-results"])
