from fastapi import APIRouter

from schemas.test_results import TestResultsRequest, TestResultsResponse
from services.ollama.test_results_service import evaluate_full_score, evaluate_tasks_results, evaluate_tasks_score

router = APIRouter()


@router.post("/generate_test_result", response_model=TestResultsResponse)
async def generate_test_results(request: TestResultsRequest) -> TestResultsResponse:
    tasks_evaluation_score = await evaluate_tasks_results(request)
    tasks_score = evaluate_tasks_score(tasks_evaluation_score)
    full_score = evaluate_full_score(tasks_score)
    return full_score
