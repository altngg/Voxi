from schemas.test_results import TaskEvaluationScore, TestResultsRequest
from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from services.test_results.prompts import convert_test_results_to_prompt
import pydantic
from fastapi import HTTPException
import json


async def evaluate_tasks_results(request: TestResultsRequest) -> TaskEvaluationScore:
    prompt = convert_test_results_to_prompt(request)
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
    }

    try:
        async with OllamaClient() as client:
            raw_response = await client.generate(prompt, format=json_schema)
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    if not raw_response or not raw_response.strip():
        raise HTTPException(status_code=500, detail="Empty response from Ollama")

    json_str = extract_json(raw_response)

    try:
        return TaskEvaluationScore.model_validate_json(json_str)
    except pydantic.ValidationError as e:
        print(f"Validation error: {e}\nRaw response: {raw_response}")
        raise HTTPException(
            status_code=500, detail=f"Invalid response format: {str(e)}"
        )
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}\nRaw response: {raw_response}")
        raise HTTPException(
            status_code=500, detail=f"Invalid JSON in response: {str(e)}"
        )
