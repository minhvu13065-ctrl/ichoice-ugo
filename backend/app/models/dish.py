from pydantic import BaseModel
from typing import Literal, Optional


class DishAttributes(BaseModel):
    spicy: float = 0.0       # 0–1
    sour: float = 0.0
    sweet: float = 0.0
    salty: float = 0.0
    rich: float = 0.0        # béo/ngậy
    temperature: Literal["hot", "cold", "room"] = "hot"
    fullness: Literal["light", "medium", "full"] = "medium"
    cuisine: str = "vietnamese"
    price_range: Literal["cheap", "medium", "expensive"] = "medium"
    group_tags: list[str] = []   # ["share", "date", "party", "family"]
    restrictions: list[str] = [] # ["meat", "seafood", "pork", "gluten"]
    is_vegan: bool = False
    is_vegetarian: bool = False


class Dish(BaseModel):
    id: str
    name_vi: str
    name_en: str
    description_vi: str = ""
    description_en: str = ""
    image_url: str = ""
    attributes: DishAttributes
    avg_rating: float = 0.0
    review_count: int = 0
