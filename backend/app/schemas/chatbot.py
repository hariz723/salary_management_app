from typing import Any

from pydantic import BaseModel, Field


class ChatbotQueryRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="User question about compensation or workforce data",
    )


class ChatbotQueryResponse(BaseModel):
    answer: str
    category: str
    data_type: str = "text"  # "text", "kpi", "table", "comparison", "employee"
    data: dict[str, Any] | None = None
    suggestions: list[str] = Field(default_factory=list)
