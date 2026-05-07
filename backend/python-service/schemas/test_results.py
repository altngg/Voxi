from pydantic import BaseModel
from typing import Optional, List

class TaskResult(BaseModel):
    name: str
    answer: str
    topic: str
    user_answer: str

class TopicScore(BaseModel):
    topic: str
    score: int

class TestResultsRequest(BaseModel):
    language: str
    levels: List[str]
    tasks_results: List[TaskResult]
    topics: List[str]

class TestResultsResponse(BaseModel):
    overall_level: str
    grammar_score: int
    vocabulary_score: int
    topic_scores: List[TopicScore]