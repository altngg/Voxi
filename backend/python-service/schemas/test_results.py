from pydantic import BaseModel
from typing import List

class TaskResult(BaseModel):
    name: str
    answer: str
    topic: str
    user_answer: str

class TaskScore(BaseModel):
    topic: str
    is_correct: bool

class TopicScore(BaseModel):
    topic: str
    score: int

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