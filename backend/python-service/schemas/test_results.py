from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List

from guardrails.prompt_injection import reject_injected_topics
from .common import AnswerText, Language, Level, ShortText, TaskText, UserAnswerText


class TaskResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: TaskText
    answer: AnswerText
    topic: ShortText
    user_answer: UserAnswerText


class TaskScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: str
    is_correct: bool


class TopicScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: ShortText
    score: int = Field(ge=0, le=12)


class TestResultsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    language: Language
    levels: List[Level] = Field(min_length=1, max_length=6)
    tasks_results: List[TaskResult] = Field(min_length=1, max_length=50)
    topics: List[ShortText] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_request(self):
        if len(self.levels) != len(set(self.levels)):
            raise ValueError("levels contains duplicates")

        if len(self.topics) != len(set(self.topics)):
            raise ValueError("topics contains duplicates")
        reject_injected_topics(self.topics)

        known_topics = set(self.topics)
        missing = sorted(
            {task.topic for task in self.tasks_results if task.topic not in known_topics}
        )
        if missing:
            raise ValueError(f"tasks_results topics not listed in topics: {missing}")

        return self


class TaskEvaluationScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tasks_scores: List[TaskScore]
    vocabulary_score: int = Field(ge=0, le=100)


class TestResultsIncomplete(BaseModel):
    grammar_score: int
    vocabulary_score: int
    topics_scores: List[TopicScore]


class TestResultsResponse(BaseModel):
    overall_level: str
    grammar_score: int
    vocabulary_score: int
    topic_scores: List[TopicScore]
