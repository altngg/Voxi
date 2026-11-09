from schemas.test_results import TaskEvaluationScore, TestResultsRequest
from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from guardrails.output_validation import (
    MAX_OUTPUT_ATTEMPTS,
    OutputValidationError,
    validate_task_evaluation,
)
from guardrails.prompt_injection import injection_reason, quote_data
from services.test_results.prompts import convert_test_results_to_prompt
import pydantic
from fastapi import HTTPException
import json


async def evaluate_tasks_results(request: TestResultsRequest) -> TaskEvaluationScore:
    last_error = None
    last_raw = None

    for _ in range(MAX_OUTPUT_ATTEMPTS):
        prompt = convert_test_results_to_prompt(request)
        if last_error:
            prompt += f"""

        Previous JSON failed validation:
        {quote_data(last_error, "validation_error")}
        Return corrected JSON only. Keep tasks_scores in the same order as the tasks.
        Copy each topic exactly from the task list.
        """

        try:
            raw_response = await _generate_evaluation(request, prompt)
            last_raw = raw_response
            parsed = TaskEvaluationScore.model_validate_json(extract_json(raw_response))
            return _force_injected_answers_incorrect(
                validate_task_evaluation(parsed, request), request
            )
        except HTTPException:
            raise
        except (
            pydantic.ValidationError,
            json.JSONDecodeError,
            OutputValidationError,
        ) as e:
            last_error = str(e)
            print(f"Output validation error: {e}\nRaw response: {last_raw}")
        except Exception as e:
            print(f"Error details: {type(e).__name__}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(
        status_code=500,
        detail=f"Invalid response format: {last_error}. Raw response: {last_raw}",
    )


async def _generate_evaluation(request: TestResultsRequest, prompt: str) -> str:
    tasks_count = len(request.tasks_results)

    json_schema = {
        "type": "object",
        "properties": {
            "vocabulary_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
            },
            "tasks_scores": {
                "type": "array",
                "minItems": tasks_count,
                "maxItems": tasks_count,
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "enum": request.topics, # topics can repeat, can't fix it here
                        },
                        "is_correct": {
                            "type": "boolean",
                        },
                    },
                    "required": ["topic", "is_correct"],
                },
            },
        },
        "required": [
            "vocabulary_score",
            "tasks_scores",
        ],
        "additionalProperties": False,
    }

    async with OllamaClient() as client:
        raw_response = await client.generate(prompt, format=json_schema)

    if not raw_response or not raw_response.strip():
        raise OutputValidationError("Empty response from Ollama")

    return raw_response


def _force_injected_answers_incorrect(
    score: TaskEvaluationScore, request: TestResultsRequest
) -> TaskEvaluationScore:
    tasks = []
    changed = False
    for expected, got in zip(request.tasks_results, score.tasks_scores):
        if injection_reason(expected.user_answer):
            tasks.append(got.model_copy(update={"is_correct": False}))
            changed = True
        else:
            tasks.append(got)
    if not changed:
        return score
    return score.model_copy(update={"tasks_scores": tasks})
