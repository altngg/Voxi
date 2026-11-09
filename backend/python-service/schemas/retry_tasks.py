from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List

from .common import AnswerText, Language, ShortText, TaskText, TaskType


class IncorrectTaskInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: TaskText
    topic: ShortText
    task_type: TaskType


class RetryTopicScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: ShortText
    score: int = Field(ge=-100, le=100)


class NewCorrectTask(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: TaskText
    answer: AnswerText
    topic: ShortText
    options: List[str] = Field(default_factory=list)
    task_type: TaskType


class RetryTasksRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: Language
    incorrect_tasks: List[IncorrectTaskInfo] = Field(min_length=1, max_length=20)
    topics_scores: List[RetryTopicScore] = Field(min_length=0, max_length=100)

    @model_validator(mode="after")
    def validate_request(self):
        topics = [item.topic for item in self.topics_scores]
        if len(topics) != len(set(topics)):
            raise ValueError("topics_scores contains duplicate topics")
        return self


class RetryTasksResponse(BaseModel):
    tasks: List[NewCorrectTask]
