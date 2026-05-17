from fastapi import APIRouter

from schemas.retry_tasks import RetryTasksRequest, RetryTasksResponse
from services.ollama.retry_tasks_service import (
    generate_retry_tasks as generate_retry_tasks_service,
)

router = APIRouter()


@router.post("/generate_retry_tasks", response_model=RetryTasksResponse)
async def generate_retry_tasks(request: RetryTasksRequest) -> RetryTasksResponse:
    return await generate_retry_tasks_service(request)
