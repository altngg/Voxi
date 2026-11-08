from enum import Enum
from typing import Annotated, Literal

from pydantic import StringConstraints


NonEmptyText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1),
]

ShortText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]

Language = Literal["en"]


class TaskType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    GAP_FILLING = "GAP_FILLING"
    TRUE_FALSE = "TRUE_FALSE"