from fastapi import APIRouter

from .test_chat import router as test_chat_router
from .test_results import router as test_results_router
from .retry_tasks import router as retry_tasks_router

router = APIRouter()

router.include_router(test_chat_router, prefix="/test-chat", tags=["test-chatsssss"])
router.include_router(test_results_router, tags=["test-results"])
router.include_router(retry_tasks_router, tags=["retry-tasks"])
