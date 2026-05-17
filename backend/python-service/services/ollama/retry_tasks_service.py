from typing import List

from clients.ollama_client import OllamaClient
import pydantic
from fastapi import HTTPException
import json
import re

from schemas.retry_tasks import IncorrectTaskInfo, RetryTasksRequest, RetryTasksResponse
from schemas.test_results import TopicScore


async def generate_retry_tasks(request: RetryTasksRequest) -> RetryTasksResponse:
    tasks = []
    
    for task in request.incorrect_tasks:
        raw_response = await generate_retry_task(task, request.language, request.topics_scores)
        json_str = extract_json(raw_response)
        
        try:
            task_data = json.loads(json_str)
            if "task" in task_data:
                tasks.append(task_data["task"])
            else:
                tasks.append(task_data)
        except json.JSONDecodeError as e:
            print(f"JSON decode error for task {task.name}: {e}\nRaw response: {raw_response}")
            raise HTTPException(
                status_code=500, detail=f"Invalid JSON in response for task {task.name}: {str(e)}"
            )
    
    try:
        return RetryTasksResponse(tasks=tasks)
    except pydantic.ValidationError as e:
        print(f"Validation error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Invalid response format: {str(e)}"
        )

def extract_json(text: str) -> str:
    json_match = re.search(r"\{.*\}", text, re.DOTALL)
    if json_match:
        return json_match.group()
    return text


def convert_retry_task_to_prompt(task_name: str, task_topic: str, task_type: str, language: str, topics: str):
    prompt = f"""
        Вы - профессиональный преподаватель {language} языка. Ваша задача - создать ОДНО новое задание на замену существующему.

        ВХОДНЫЕ ДАННЫЕ:
        - Изучаемый язык: {language}
        - Исходное задание: "{task_name}"
        - Тема нового задания: {task_topic}
        - Тип нового задания: {task_type}
        - Оценки пользователя по темам: {topics}

        КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
        1. Заполните ВСЕ поля без исключения. Ни одно поле не может быть пустым.
        2. Поле "name" - это КОНКРЕТНОЕ задание (например, "She _ to school every day"), а не описание или тема.
        3. Поле "answer" - это ПРАВИЛЬНЫЙ ответ на ваше задание (одно слово, фраза или true/false).
        4. Поле "options" должно присутствовать ВСЕГДА:
           - Для MULTIPLE_CHOICE: массив из 4 строк с вариантами ответов
           - Для TRUE_FALSE: пустой массив []
           - Для GAP_FILLING: пустой массив []
        5. Контекст задания должен ПОЛНОСТЬЮ отличаться от исходного.
        6. Задание должно быть темы "{task_topic}" и типа "{task_type}".
        
        ПРАВИЛА ДЛЯ КАЖДОГО ТИПА:
    """

    match task_type:
        case "MULTIPLE_CHOICE":
            prompt += f"""
                - Создайте вопрос с 4 вариантами ответа в поле "options".
                - Только 1 вариант правильный, остальные 3 - однозначно неправильные.
                - Правильный вариант продублируйте в поле "answer".
                - Ответ обязательно должен содержать options с 4 элементами
                - Пример правильного формата:
                  {{
                    "name": "What is the opposite of 'tiny'?",
                    "answer": "huge",
                    "options": ["small", "tiny", "huge", "miniature"],
                    "topic": "{task_topic}",
                    "task_type": "MULTIPLE_CHOICE"
                  }}
            """
        case "TRUE_FALSE":
            prompt += f"""
                - Создайте КОНКРЕТНОЕ утверждение, которое однозначно true или однозначно false.
                - Утверждение должно быть ОДНОЗНАЧНО истинным (true) или ложным (false).
                - В поле "answer" напишите строго "true" или "false" (строчными буквами).
                - В поле "options" укажите ПУСТОЙ МАССИВ: []
                - Пример: 
                  {{
                    "name": "Water boils at 100 degrees Celsius.", 
                    "answer": "true", 
                    "options": [],
                    "topic": "{task_topic}",
                    "task_type": "TRUE_FALSE"
                  }}
            """
        case "GAP_FILLING":
            prompt += f"""
                - Создайте предложение с ОДНИМ пропуском, обозначенным ОДНИМ символом подчеркивания "_".
                - НЕ НУЖНО ИСПОЛЬЗОВАТЬ БОЛЕЕ ОДНОГО ПОДЧЕРКИВАНИЯ ИЛИ ДРУГИХ СИМВОЛОВ ДЛЯ ОБОЗНАЧЕНИЯ ПРОПУСКА.
                - Пропуск должен быть на месте ОДНОГО пропущенного слова.
                - В поле "answer" напишите ОДНО слово, которое идеально подходит для заполнения пропуска.
                - В поле "options" укажите ПУСТОЙ МАССИВ: []
                - ВАЖНО: Предложение ДОЛЖНО быть грамматически правильным и осмысленным БЕЗ вставленного слова, с пропуском на месте нужного слова.
                - Пример ПРАВИЛЬНОГО формата:
                {{
                    "name": "She _ to school every day.",
                    "answer": "goes",
                    "options": [],
                    "topic": "{task_topic}",
                    "task_type": "GAP_FILLING"
                }}
            """
    
    prompt += f"""
        ВАЖНО: Поле "topic" должно быть строго одним из: {topics.split(',')[0] if topics else task_topic}
        Поле "task_type" должно быть строго "{task_type}"

        ВЫВЕДИТЕ ТОЛЬКО JSON-ОБЪЕКТ без пояснений.
        УБЕДИТЕСЬ, ЧТО ВСЕ ПОЛЯ ЗАПОЛНЕНЫ ОСМЫСЛЕННЫМИ ДАННЫМИ.
        ВСЕГДА ВКЛЮЧАЙТЕ ПОЛЕ "options", ДАЖЕ ЕСЛИ ОНО ПУСТОЕ.
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

    task_properties = {
        "name": {"type": "string", "minLength": 5},
        "answer": {"type": "string", "minLength": 1},
        "topic": {"type": "string", "enum": topics_names},
        "task_type": {"type": "string", "enum": ["MULTIPLE_CHOICE", "GAP_FILLING", "TRUE_FALSE"]},
        "options": {"type": "array", "items": {"type": "string"}}  # Always include options
    }

    if task.task_type == "MULTIPLE_CHOICE":
        task_properties["options"]["minItems"] = 4
        task_properties["options"]["maxItems"] = 4
    
    task_required = ["name", "answer", "topic", "task_type", "options"]
    
    json_schema = {
        "type": "object",
        "properties": {
            "task": {
                "type": "object",
                "properties": task_properties,
                "required": task_required,
                "additionalProperties": False,
            },
        },
        "required": ["task"],
        "additionalProperties": False,
    }

    print(f"Using schema for task type {task.task_type}: {json_schema}")

    try:
        async with OllamaClient() as client:
            raw_response = await client.generate(prompt, format=json_schema)
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    if not raw_response or not raw_response.strip():
        raise HTTPException(status_code=500, detail="Empty response from Ollama")

    return raw_response
