from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

from .common import Language, ShortText, TaskType
from .test_results import TopicScore

class IncorrectTaskInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    topic: ShortText
    task_type: TaskType

class NewCorrectTask(BaseModel):
    name: str
    answer: str
    topic: str
    options: Optional[List[str]]
    task_type: str

class RetryTasksRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: Language
    incorrect_tasks: List[IncorrectTaskInfo] = Field(min_length=1, max_length=50)
    topics_scores: List[TopicScore] = Field(min_length=1, max_length=100)

class RetryTasksResponse(BaseModel):
    tasks: List[NewCorrectTask]