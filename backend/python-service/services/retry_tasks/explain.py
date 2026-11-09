from typing import Optional
import json

from fastapi import HTTPException

from clients.ollama_client import OllamaClient
from core.json_extract import extract_json
from guardrails.output_validation import (
    CJK_CHAR_RANGES,
    EXPLANATION_PREFIX,
    MAX_OUTPUT_ATTEMPTS,
    OutputValidationError,
    validate_generated_explanation,
)
from guardrails.prompt_injection import injection_reason, quote_data
from schemas.retry_tasks import IncorrectTaskExplanation, IncorrectTaskInfo
from services.retry_tasks.prompts import convert_incorrect_task_to_explanation_prompt

_EXPLANATION_NUM_PREDICT = 200

_EXPLANATION_SCHEMA = {
    "type": "object",
    "properties": {
        "correct_answer": {"type": "string", "minLength": 1, "maxLength": 100},
        "explanation": {
            "type": "string",
            "pattern": f"^{EXPLANATION_PREFIX} [^{CJK_CHAR_RANGES}]+$",
        },
    },
    "required": ["correct_answer", "explanation"],
    "additionalProperties": False,
}

_INJECTED_TASK_EXPLANATION = (
    f"{EXPLANATION_PREFIX} ответ должен содержать только решение задания. "
    "Этот ответ содержит посторонний текст, поэтому он не засчитан."
)


async def generate_validated_explanation(
    task: IncorrectTaskInfo, language: str
) -> IncorrectTaskExplanation:
    if injection_reason(task.name):
        return IncorrectTaskExplanation(
            incorrect_task_id=task.id, explanation=_INJECTED_TASK_EXPLANATION
        )

    last_error = None
    last_raw = None

    for _ in range(MAX_OUTPUT_ATTEMPTS):
        try:
            raw_response = await generate_explanation(
                task, language, previous_error=last_error
            )
            last_raw = raw_response
            data = json.loads(extract_json(raw_response))
            if not isinstance(data, dict):
                raise OutputValidationError("response must be a JSON object")
            return validate_generated_explanation(data, task)
        except HTTPException:
            raise
        except (json.JSONDecodeError, OutputValidationError) as e:
            last_error = str(e)
            print(
                f"Output validation error for explanation of task {task.id}: {e}\n"
                f"Raw response: {last_raw}"
            )

    raise HTTPException(
        status_code=500,
        detail=f"Invalid explanation for task {task.id}: {last_error}. Raw response: {last_raw}",
    )


async def generate_explanation(
    task: IncorrectTaskInfo,
    language: str,
    previous_error: Optional[str] = None,
) -> str:
    prompt = convert_incorrect_task_to_explanation_prompt(
        task.name, task.topic, task.task_type.value, language
    )
    if previous_error:
        prompt += f"""

        The previous result failed these checks:
        {quote_data(previous_error, "validation_error")}
        """

    try:
        async with OllamaClient() as client:
            raw_response = await client.generate(
                prompt,
                format=_EXPLANATION_SCHEMA,
                num_predict=_EXPLANATION_NUM_PREDICT,
            )
    except Exception as e:
        print(f"Error details: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    if not raw_response or not raw_response.strip():
        raise OutputValidationError("Empty response from Ollama")

    return raw_response
