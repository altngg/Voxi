from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException
import json
import re

from schemas.retry_tasks import RetryTasksRequest, RetryTasksResponse


async def generate_retry_tasks(request: RetryTasksRequest) -> RetryTasksResponse:
    prompt = convert_retry_tasks_to_prompt(request)

    json_schema = {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "minItems": len(request.incorrect_tasks),
                "maxItems": len(request.incorrect_tasks),
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                        },
                        "answer": {
                            "type": "string",
                        },
                        "options": {
                            "type": "array",
                            "items": {
                                "type": "string",
                            },
                        },
                        "topic": {
                            "type": "string",
                            "enum": [topic.topic for topic in request.topics_scores],
                        },
                        "task_type": {
                            "type": "string",
                            "enum": ["MULTIPLE_CHOICE", "GAP_FILLING", "TRUE_FALSE"],
                        },
                    },
                    "required": ["name", "answer", "topic", "task_type"],
                },
            },
        },
        "required": [
            "tasks",
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
        return RetryTasksResponse.model_validate_json(json_str)
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


def convert_retry_tasks_to_prompt(request: RetryTasksRequest) -> str:
    incorrect_tasks_str = ""
    for i, task in enumerate(request.incorrect_tasks, 1):
        incorrect_tasks_str += f"\n{i}. Задание: {task.name}\n"
        incorrect_tasks_str += f"   Тема: {task.topic}\n"

    topics_str = ", ".join([topic.topic for topic in request.topics_scores])

    prompt = f"""Вы — профессиональный преподаватель {request.language} языка.

        ВХОДНЫЕ ДАННЫЕ:
        - Язык: {request.language}
        - Неправильные задания: {incorrect_tasks_str}
        - Возможные темы и оценки пользователя по ним: {topics_str}

        ПРАВИЛА СОЗДАНИЯ ЗАДАНИЙ:
        1. Для каждого неправильного задания создайте по 2 новых правильных задания.
        2. Новое задание должно быть по той же теме, что и неправильное задание.
        3. Новое задание должно быть по тому же типу, что и неправильное задание.
        4. Новое задание должно быть по тому же уровню сложности, что и неправильное задание.
        5. Новое задание должно быть по тому же формату, что и неправильное задание.
        6. Новое задание должно быть по тому же стилю, что и неправильное задание.
        7. Новое задание должно быть по тому же уровню сложности, что и неправильное задание.
        8. Новое задание должно быть по тому же формату, что и неправильное задание.
        9. В новом задании отличаться должен только контент, но не формат.
        10. В новом задание должен быть однозначный и правильный ответ, который стоит указать в поле answer.

        ВАЖНЫЕ ТРЕБОВАНИЯ:
        - Возвращайте ТОЛЬКО JSON-объект, без обёрток ```json и без комментариев.
    """
    return prompt
