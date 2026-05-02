from fastapi import APIRouter

from schemas.test_results import TestResultsRequest, TestResultsResponse
from services.ollama.test_results_service import evaluate_test_results

router = APIRouter()


@router.post("/generate_test_results", response_model=TestResultsResponse)
async def generate_test_results(request: TestResultsRequest) -> TestResultsResponse:
    return await evaluate_test_results(request)
