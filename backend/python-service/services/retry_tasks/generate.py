from typing import List

from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from services.retry_tasks.prompts import convert_retry_task_to_prompt
import pydantic
from fastapi import HTTPException
import json

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

async def generate_retry_task(task: IncorrectTaskInfo, language: str, topics: List[TopicScore]):
    topics_names = [t.topic for t in topics]
    topic_score = next((t.score for t in topics if t.topic == task.topic), 0)

    prompt = convert_retry_task_to_prompt(
        task.name, task.topic, task.task_type, language, topic_score
    )

    task_properties = {
        "name": {"type": "string", "minLength": 5},
        "answer": {"type": "string", "minLength": 1},
        "topic": {"type": "string", "enum": topics_names},
        "task_type": {"type": "string", "enum": ["MULTIPLE_CHOICE", "GAP_FILLING", "TRUE_FALSE"]},
        "options": {"type": "array", "items": {"type": "string"}}
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
