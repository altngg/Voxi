from pydantic import BaseModel
from typing import List, Optional

from .test_results import TopicScore

class IncorrectTaskInfo(BaseModel):
    name: str
    topic: str
    task_type: str

class NewCorrectTask(BaseModel):
    name: str
    answer: str
    topic: str
    options: Optional[List[str]]
    task_type: str

class RetryTasksRequest(BaseModel):
    language: str
    incorrect_tasks: List[IncorrectTaskInfo]
    topics_scores: List[TopicScore]

class RetryTasksResponse(BaseModel):
    tasks: List[NewCorrectTask]