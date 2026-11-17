from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List

from guardrails.prompt_injection import reject_injected_topics
from .common import AnswerText, ExplanationText, Language, ShortText, TaskText, TaskType


class IncorrectTaskInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int = Field(ge=1)
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


class IncorrectTaskExplanation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    incorrect_task_id: int
    explanation: ExplanationText


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
        task_ids = [task.id for task in self.incorrect_tasks]
        if len(task_ids) != len(set(task_ids)):
            raise ValueError("incorrect_tasks contains duplicate ids")
        reject_injected_topics(topics)
        reject_injected_topics([task.topic for task in self.incorrect_tasks])
        return self


class RetryTasksResponse(BaseModel):
    tasks: List[NewCorrectTask]
    incorrect_tasks_explanations: List[IncorrectTaskExplanation]
