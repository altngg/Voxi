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


def convert_retry_task_to_prompt(
    task_name: str, task_topic: str, task_type: str, language: str, topic_score: int
):
    prompt = f"""
        Generate a new task to replace the existing one.

        input data:
        - language: {language}
        - existing task: "{task_name}"
        - new task topic: {task_topic}
        - new task type: {task_type}
        - user's score for this topic: {topic_score}

        GENERAL RULES:
        - The new exercise MUST be different from the original exercise.
        - The exercise must match the requested topic and exercise type.
        - The exercise should sound natural and grammatically correct.

        FIELD RULES:
        - "name" - the actual exercise content, NOT a description or title
        - "answer" - the correct answer to the exercise
        - "topic" - must be exactly "{task_topic}"
        - "task_type" - must be exactly "{task_type}"
        - "options" - required for all task types
    """

    match task_type:
        case "MULTIPLE_CHOICE":
            prompt += f"""
                MORE RULES:
                - Create a question with EXACTLY 4 answer options in the "options" field
                - Only ONE option must be correct
                - The other 3 must be clearly incorrect
                - The correct option must exactly match the "answer" field
                
                GOOD EXAMPLE:
                    {{
                    "name": "What is the opposite of 'tiny'?",
                    "answer": "huge",
                    "options": ["small", "tiny", "huge", "miniature"],
                    "topic": "Vocabulary",
                    "task_type": "MULTIPLE_CHOICE"
                    }}
            """
        case "TRUE_FALSE":
            prompt += f"""
                MORE RULES:
                - Create ONE clear factual statement.
                - The statement must be obviously true or obviously false.
                - "answer" must be exactly "true" or "false".
                - "options" must be an empty array [].
                
                GOOD EXAMPLE:
                    {{
                    "name": "Water boils at 100 degrees Celsius.",
                    "answer": "true",
                    "options": [],
                    "topic": "Science",
                    "task_type": "TRUE_FALSE"
                    }}
            """
        case "GAP_FILLING":
            prompt += f"""
                MORE RULES:
                - Create ONE sentence with EXACTLY ONE missing word.
                - Use EXACTLY ONE underscore character: _
                - "answer" must contain only the missing word.
                - "options" must be an empty array [].
                - The sentence must sound natural.
                GOOD EXAMPLE:
                    {{
                    "name": "She _ to school every day.",
                    "answer": "goes",
                    "options": [],
                    "topic": "Science",
                    "task_type": "GAP_FILLING"
                    }}
            """

    return prompt

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
