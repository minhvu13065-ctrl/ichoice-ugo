from pydantic import BaseModel, Field
from typing import Optional


class ReviewCreate(BaseModel):
    session_id: str
    dish_id: str
    restaurant_id: Optional[str] = None
    stars: int = Field(..., ge=1, le=5)
    tags: list[str] = []
    comment: str = ""


class ReviewResponse(BaseModel):
    id: str
    dish_id: str
    stars: float
    review_count: int
