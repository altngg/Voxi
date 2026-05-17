from typing import List

from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException
import json
import re

from schemas.retry_tasks import IncorrectTaskInfo, RetryTasksRequest, RetryTasksResponse
from schemas.test_results import TopicScore


async def generate_retry_tasks(request: RetryTasksRequest) -> RetryTasksResponse:
    raw_response_list = []
    for task in request.incorrect_tasks:
        raw_response = await generate_retry_task(task, request.language, request.topics_scores)
        raw_response_list.append(raw_response)

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


def convert_retry_task_to_prompt(task_name: str, task_topic: str, task_type: str, language: str, topics: str):
    prompt = f"""
        Вы - профессиональный преподаватель {language} языка. Ваша задача - создать для ученика новые задания
        на основе уже существующих заданий и оценки ученика по лингвистическим темам.

        ВХОДНЫЕ ДАННЫЕ:
        - Изучаемый язык: {language}
        - Задание, для которого нужен аналог: {task_name}
        - Оценки пользователя по темам: {topics}

        ПРАВИЛА СОЗДАНИЯ ЗАДАНИЯ:
        - Для задания создай ровно одно новое задание.
        - У нового задания должен полностью отличаться контекст.
        - Новое задание должно быть темы - {task_topic}.
        - Новое задание должно быть типа - {task_type}.
        - Правильный ответ записывается в поле answer.
        - У нового задания правильный ответ должен быть однозначным.
    """

    match task_type:
        case "MULTIPLE_CHOICE":
            prompt += f"""
                - Новое задание должно содержать поле options для выбора пользователем правильного ответа из списка предложенных
                - В options должно быть 3 однозначно неправильных и 1 однозначно правильный ответа
            """
        case "TRUE_FALSE":
            prompt += f"""
                - Новое задание должно быть однозначно ложным или однозначно верным предложением
                - Поле answer должно содержать либо "false" либо "true"
            """
        case "GAP_FILLING":
            prompt += f"""
                - Новое задание должно содержать пробел в предложении, обозначенный нижним подчеркиванием (_)
                - В поле answer должно быть одно слово, которое однозначно подходит для заполнения пробела в предложении
            """
    
    return prompt

async def generate_retry_task(task: IncorrectTaskInfo, language: str, topics: List[TopicScore]):
    topics_names = []
    topics_str = ""
    for i, topic in enumerate(topics, 1):
        topics_names.append(topic.topic)
        topics_str += f"\n{i}. Тема: {topic.topic}\n"
        topics_str += f"   Оценка пользователя по теме: {topic.score}\n"

    prompt = convert_retry_task_to_prompt(task.name, task.topic, task.task_type, language, topics_str)

    json_schema = {
        "type": "object",
        "properties": {
            "task": {
                "type": "object",
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
                            "enum": topics_names,
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
            "task",
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

    return raw_response
