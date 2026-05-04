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

    prompt = f"""Вы — профессиональный преподаватель {request.language} языка.
        Ваша задача — оценить результаты теста ученика и вернуть СТРОГО JSON-объект.

        ВХОДНЫЕ ДАННЫЕ:
        - Язык: {request.language}
        - Возможные уровни: {levels_str}
        - Темы для оценки ({topics_count} шт.): {topics_str}
        - Результаты теста:{tasks_results_str}

        ПРАВИЛА ОЦЕНКИ ЗАДАНИЙ:
        1. Если ответ пользователя совпадает с правильным — задание выполнено полностью.
        2. Если ответ грамматически верен и подходит по смыслу, но отличается от эталона — задание выполнено частично.
        3. Если ответ неверен или отсутствует — задание не выполнено.

        ФОРМАТ ОТВЕТА (строго JSON, без markdown и пояснений):
        - "overall_level" — общий уровень владения языком, ОДИН из значений: {levels_str}.
        - "grammar_score" — целое число от 0 до 100 по 100-балльной шкале
        (0 — нет знаний грамматики, 50 — средне, 100 — идеальная грамматика).
        - "vocabulary_score" — целое число от 0 до 100 по 100-балльной шкале
        (0 — нет словарного запаса, 50 — средне, 100 — идеальный словарь).
        - "topic_scores" — массив из РОВНО {topics_count} объектов вида {{"topic": <тема>, "score": <0..12>}}.
        Каждая тема из списка [{topics_str}] должна встречаться РОВНО ОДИН раз.

        ВАЖНЫЕ ТРЕБОВАНИЯ:
        - grammar_score и vocabulary_score используют шкалу 0–100, а НЕ 0–10. Например, средний уровень — это около 50–70, а не 5–7.
        - В topic_scores должно быть ровно {topics_count} элементов — по одному на каждую тему из списка выше.
        - Если по теме не было заданий — оцените её на основании общего уровня владения языком.
        - Возвращайте ТОЛЬКО JSON-объект, без обёрток ```json и без комментариев.
    """
    return prompt
