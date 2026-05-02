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

    tasks_results_str = ""
    for task in request.tasks_results:
        tasks_results_str += f"Задание: {task.name}\n"
        tasks_results_str += f"Правильный ответ: {task.answer}\n"
        tasks_results_str += f"Тема задания: {task.topic}\n"
        tasks_results_str += f"Ответ пользователя: {task.user_answer}\n"
        tasks_results_str += "--------------------------------\n"

    prompt = f"""
        Вы профессиональный преподаватель {request.language} языка.
        Вам нужно проверить результаты теста и оценить уровень владения языком.

        ВХОДНЫЕ ДАННЫЕ:
            - Язык: {request.language}
            - Возможные уровни языка: {levels_str}
            - Возможные темы заданий: {topics_str}
            - Результаты прохождения заданий: {tasks_results_str}
        
        ПРАВИЛА ОЦЕНКИ:
            - Если ответ пользователя совпадает с правильным ответом, то задание считается выполненным.
            - Если ответ пользователя не совпадает с правильным ответом, но соответствует грамматическим правилам языка и подходит по смыслу, то задание считается выполненным частично.
            - Если ответ пользователя не совпадает с правильным ответом, то задание считается не выполненным.
            - Общий уровень владения языком (overall_level) должен быть одним из возможных уровней языка {levels_str}.
            - Оценка по грамматике (grammar_score) должна быть в диапазоне от 0 до 100.
            - Оценка по словарю (vocabulary_score) должна быть в диапазоне от 0 до 100.
            - Оценка по теме (topic_scores) должна быть в диапазоне от 0 до 12, все топики должны соответствовать предложенным: {topics_str}

        Верните ТОЛЬКО JSON-объект с оценкой, без дополнительных пояснений.
    """
    return prompt
