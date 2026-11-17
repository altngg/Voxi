from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints


class TestChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: Annotated[str, StringConstraints(min_length=1, max_length=4000)]


class TestChatResponse(BaseModel):
    response: str
