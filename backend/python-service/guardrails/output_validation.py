from typing import Any, Dict, List

from pydantic import ValidationError

from schemas.common import TaskType
from schemas.retry_tasks import IncorrectTaskInfo, NewCorrectTask
from schemas.test_results import TaskEvaluationScore, TestResultsRequest

MAX_OUTPUT_ATTEMPTS = 2


class OutputValidationError(ValueError):
    pass


def validate_generated_retry_task(
    data: Dict[str, Any], original: IncorrectTaskInfo
) -> NewCorrectTask:
    try:
        task = NewCorrectTask.model_validate(data)
    except ValidationError as e:
        raise OutputValidationError(str(e)) from e

    errors: List[str] = []
    expected_type = original.task_type.value
    actual_type = (
        task.task_type.value
        if isinstance(task.task_type, TaskType)
        else str(task.task_type)
    )

    if task.topic != original.topic:
        errors.append(f'topic must be "{original.topic}", got "{task.topic}"')

    if actual_type != expected_type:
        errors.append(f'task_type must be "{expected_type}", got "{actual_type}"')

    if _normalize_text(task.name) == _normalize_text(original.name):
        errors.append("new task must be different from the original")

    if len(task.name.strip()) < 5:
        errors.append("name is too short")

    match expected_type:
        case TaskType.MULTIPLE_CHOICE.value:
            errors.extend(_multiple_choice_errors(task))
        case TaskType.TRUE_FALSE.value:
            errors.extend(_true_false_errors(task))
        case TaskType.GAP_FILLING.value:
            errors.extend(_gap_filling_errors(task))

    if errors:
        raise OutputValidationError("; ".join(errors))

    return _normalize_generated_task(task, original)


def validate_task_evaluation(
    score: TaskEvaluationScore, request: TestResultsRequest
) -> TaskEvaluationScore:
    errors: List[str] = []

    if len(score.tasks_scores) != len(request.tasks_results):
        errors.append(
            "tasks_scores must contain exactly "
            f"{len(request.tasks_results)} items, got {len(score.tasks_scores)}"
        )

    coerced = []
    for index, (expected, got) in enumerate(
        zip(request.tasks_results, score.tasks_scores), start=1
    ):
        topic = got.topic.strip()
        if topic == expected.topic:
            coerced.append(got)
            continue
        if topic.casefold() == expected.topic.casefold():
            coerced.append(got.model_copy(update={"topic": expected.topic}))
            continue
        errors.append(
            f'task {index}: topic must be "{expected.topic}", got "{got.topic}"'
        )

    if errors:
        raise OutputValidationError("; ".join(errors))

    return score.model_copy(update={"tasks_scores": coerced})


def _normalize_text(value: str) -> str:
    return " ".join(value.casefold().split())


def _multiple_choice_errors(task: NewCorrectTask) -> List[str]:
    errors: List[str] = []
    options = [option.strip() for option in task.options]

    if len(options) != 4:
        errors.append("MULTIPLE_CHOICE must have exactly 4 options")
    if any(not option for option in options):
        errors.append("options must not contain empty strings")
    if len({option.casefold() for option in options}) != len(options):
        errors.append("options must be unique")

    answer = task.answer.strip()
    matches = [option for option in options if option.casefold() == answer.casefold()]
    if len(matches) != 1:
        errors.append('answer must match exactly one option')

    return errors


def _true_false_errors(task: NewCorrectTask) -> List[str]:
    errors: List[str] = []
    if task.options:
        errors.append("TRUE_FALSE options must be an empty array")
    if task.answer.strip().casefold() not in {"true", "false"}:
        errors.append('TRUE_FALSE answer must be "true" or "false"')
    return errors


def _gap_filling_errors(task: NewCorrectTask) -> List[str]:
    errors: List[str] = []
    if task.options:
        errors.append("GAP_FILLING options must be an empty array")
    if task.name.count("_") != 1:
        errors.append("GAP_FILLING name must contain exactly one underscore")
    if "_" in task.answer:
        errors.append("GAP_FILLING answer must not contain an underscore")
    if not task.answer.strip():
        errors.append("GAP_FILLING answer must not be empty")
    return errors


def _normalize_generated_task(
    task: NewCorrectTask, original: IncorrectTaskInfo
) -> NewCorrectTask:
    options = [option.strip() for option in task.options]
    answer = task.answer.strip()
    update = {
        "name": task.name.strip(),
        "answer": answer,
        "topic": original.topic,
        "task_type": original.task_type,
        "options": options,
    }

    if original.task_type == TaskType.TRUE_FALSE:
        update["answer"] = answer.casefold()
        update["options"] = []
    elif original.task_type == TaskType.GAP_FILLING:
        update["options"] = []
    elif original.task_type == TaskType.MULTIPLE_CHOICE:
        update["answer"] = next(
            option for option in options if option.casefold() == answer.casefold()
        )

    return task.model_copy(update=update)
