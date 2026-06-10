from pydantic import BaseModel, field_validator
from typing import Literal, Optional, Union


GroupMode = Literal["solo", "couple", "friends", "family"]
Lang = Literal["vi", "en"]


def _to_list(v: Union[str, list]) -> list[str]:
    """Chấp nhận cả string lẫn list từ frontend."""
    if isinstance(v, str):
        return [] if v in ("", "none", "any") else [v]
    return [x for x in v if x not in ("none", "any", "")]


class QuizAnswers(BaseModel):
    hunger_level: str = "medium"
    flavor: Union[str, list[str]] = []
    temperature: str = "any"
    cuisine: Union[str, list[str]] = []
    price_range: str = "any"
    time_available: str = "normal"
    mood: str = ""
    restrictions: Union[str, list[str]] = []

    @field_validator("flavor", "cuisine", "restrictions", mode="before")
    @classmethod
    def coerce_list(cls, v):
        return _to_list(v)


class RecommendationRequest(BaseModel):
    answers: QuizAnswers
    mode: GroupMode = "solo"
    lang: Lang = "vi"
    lat: Optional[float] = None
    lng: Optional[float] = None
    session_id: str
    # Các trục quiz mở rộng (optional, không bắt buộc)
    extra: dict = {}


class SwapRequest(BaseModel):
    session_id: str
    lang: Lang = "vi"


class RecommendationResponse(BaseModel):
    dish_id: str
    name_vi: str
    name_en: str
    image_url: str
    confidence: float
    reason_vi: str
    reason_en: str
    session_id: str
