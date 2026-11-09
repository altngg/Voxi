from enum import Enum
from typing import Annotated

from pydantic import BeforeValidator, StringConstraints

from core.languages import LANGUAGE_KEYS, LEVELS_CONFIG


NonEmptyText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1),
]

ShortText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]

TaskText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=500),
]

AnswerText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]


def parse_language(value: object) -> str:
    if not isinstance(value, str):
        raise TypeError("language must be a string")
    stripped = value.strip()
    if not stripped or len(stripped) > 50:
        raise ValueError("Invalid language")
    if stripped.casefold() not in LANGUAGE_KEYS:
        raise ValueError(f"Unsupported language: {value}")
    return stripped


def parse_level(value: object) -> str:
    if not isinstance(value, str):
        raise TypeError("level must be a string")
    normalized = value.strip().upper()
    if normalized not in LEVELS_CONFIG:
        raise ValueError(f"Unsupported level: {value}")
    return normalized


def parse_user_answer(value: object) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        raise TypeError("user_answer must be a string")
    if len(value) > 500:
        raise ValueError("user_answer is too long")
    return value


Language = Annotated[str, BeforeValidator(parse_language)]
Level = Annotated[str, BeforeValidator(parse_level)]
UserAnswerText = Annotated[str, BeforeValidator(parse_user_answer)]


class TaskType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    GAP_FILLING = "GAP_FILLING"
    TRUE_FALSE = "TRUE_FALSE"
