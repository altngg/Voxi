from typing import List, Optional

from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from guardrails.output_validation import (
    MAX_OUTPUT_ATTEMPTS,
    OutputValidationError,
    validate_generated_retry_task,
)
from guardrails.semantic_validation import validate_retry_task_semantics
from services.retry_tasks.prompts import convert_retry_task_to_prompt
from fastapi import HTTPException
import json

from schemas.retry_tasks import (
    IncorrectTaskInfo,
    NewCorrectTask,
    RetryTasksRequest,
    RetryTasksResponse,
    RetryTopicScore,
)


async def generate_retry_tasks(request: RetryTasksRequest) -> RetryTasksResponse:
    tasks = []

    for task in request.incorrect_tasks:
        tasks.append(
            await generate_validated_retry_task(
                task, request.language, request.topics_scores
            )
        )

    return RetryTasksResponse(tasks=tasks)


async def generate_validated_retry_task(
    task: IncorrectTaskInfo, language: str, topics: List[RetryTopicScore]
) -> NewCorrectTask:
    last_error = None
    last_raw = None

    for _ in range(MAX_OUTPUT_ATTEMPTS):
        try:
            raw_response = await generate_retry_task(
                task, language, topics, previous_error=last_error
            )
            last_raw = raw_response
            task_data = json.loads(extract_json(raw_response))
            if isinstance(task_data, dict) and "task" in task_data:
                task_data = task_data["task"]
            if not isinstance(task_data, dict):
                raise OutputValidationError("response must be a JSON object")
            generated = validate_generated_retry_task(task_data, task)
            await validate_retry_task_semantics(generated, language)
            return generated
        except HTTPException:
            raise
        except (json.JSONDecodeError, OutputValidationError) as e:
            last_error = str(e)
            print(
                f"Output validation error for task {task.name}: {e}\n"
                f"Raw response: {last_raw}"
            )

    raise HTTPException(
        status_code=500,
        detail=f"Invalid generated task for {task.name}: {last_error}. Raw response: {last_raw}",
    )


async def generate_retry_task(
    task: IncorrectTaskInfo,
    language: str,
    topics: List[RetryTopicScore],
    previous_error: Optional[str] = None,
):
    topic_score = next((t.score for t in topics if t.topic == task.topic), 0)

    prompt = convert_retry_task_to_prompt(
        task.name, task.topic, task.task_type, language, topic_score
    )
    if previous_error:
        prompt += f"""

        The previous result failed these checks:
        {previous_error}
        Generate a different valid task. Keep topic and task_type exactly as requested.
        """

    task_properties = {
        "name": {"type": "string", "minLength": 5},
        "answer": {"type": "string", "minLength": 1},
        "topic": {"type": "string", "enum": [task.topic]},
        "task_type": {"type": "string", "enum": [task.task_type.value]},
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
        raise OutputValidationError("Empty response from Ollama")

    return raw_response
