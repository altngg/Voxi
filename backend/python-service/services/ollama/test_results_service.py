from schemas.test_results import TestResultsRequest, TestResultsResponse
from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException
import json
import re


async def evaluate_test_results(request: TestResultsRequest) -> TestResultsResponse:
    prompt = convert_test_results_to_prompt(request)

    json_schema = {
        "type": "object",
        "properties": {
            "overall_level": {
                "type": "string",
                "enum": request.levels,
            },
            "grammar_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
            },
            "vocabulary_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
            },
            "topic_scores": {
                "type": "array",
                "minItems": len(request.topics),
                "maxItems": len(request.topics),
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {
                            "type": "string",
                            "enum": request.topics,
                        },
                        "score": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": 12,
                        },
                    },
                    "required": ["topic", "score"],
                },
            },
        },
        "required": [
            "overall_level",
            "grammar_score",
            "vocabulary_score",
            "topic_scores",
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
        return TestResultsResponse.model_validate_json(json_str)
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


def extract_json(text: str) -> str:
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        return json_match.group()
    return text


def convert_test_results_to_prompt(request: TestResultsRequest) -> str:
    levels_str = ", ".join(request.levels)
    topics_str = ", ".join(request.topics)
    topics_count = len(request.topics)

    tasks_results_str = ""
    for i, task in enumerate(request.tasks_results, 1):
        tasks_results_str += f"\n{i}. Задание: {task.name}\n"
        tasks_results_str += f"   Тема: {task.topic}\n"
        tasks_results_str += f"   Правильный ответ: {task.answer}\n"
        tasks_results_str += f"   Ответ пользователя: {task.user_answer}\n"

    prompt = f"""
        Evaluate English proficiency using {levels_str} levels.

        input data:
            - language: {request.language}
            - possible levels: {levels_str}
            - topics for evaluation: {topics_str}
            - test results: {tasks_results_str}

        evaluation rules:
            - If the user's answer matches the correct one, then the task is completed fully.
            - If the user's answer is grammatically correct and fits the meaning, but differs from the example, then the task is completed partially.
            - If the user's answer is incorrect or missing, then the task is not completed.

        rules for filling the fields:
        "overall_level" - one of the values: {levels_str}
            - A1/A2: basic everyday vocabulary
            - B1/B2: broader and topic-specific vocabulary
            - C1/C2: precise, natural, and nuanced vocabulary

        vocabulary_score - integer from 0 to 100
            - 0-30: basic everyday vocabulary
            - 31-60: broader and topic-specific vocabulary
            - 61-100: precise, natural, and nuanced vocabulary
        
        grammar_score - integer from 0 to 100
            - 0-30: basic grammar - frequent mistakes, meaning is sometimes unclear
            - 31-60: intermediate grammar - some mistakes, but the meaning is understandable
            - 61-100: advanced grammar - no mistakes, the meaning is clear
        
        topic_scores - array of {topics_count} objects
            - 0-3: no to little knowledge of the topic
            - 4-7: some knowledge of the topic
            - 8-12: complete knowledge of the topic
    """
    return prompt
