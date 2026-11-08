from pydantic import BaseModel, ConfigDict, Field
from typing import List

from guardrails.input_validation import ShortText

class TaskResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    answer: str
    topic: str
    user_answer: str

class TaskScore(BaseModel):
    topic: str
    is_correct: bool

class TopicScore(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: ShortText
    score: int = Field(ge=0, le=12)

class TestResultsRequest(BaseModel):
    language: str
    levels: List[str]
    tasks_results: List[TaskResult]
    topics: List[str]

class TaskEvaluationScore(BaseModel):
    tasks_scores: List[TaskScore]
    vocabulary_score: int

class TestResultsIncomplete(BaseModel):
    grammar_score: int
    vocabulary_score: int
    topics_scores: List[TopicScore]

class TestResultsResponse(BaseModel):
    overall_level: str
    grammar_score: int
    vocabulary_score: int
    topic_scores: List[TopicScore]