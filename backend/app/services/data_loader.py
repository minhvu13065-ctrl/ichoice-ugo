import json
from pathlib import Path
from app.models.dish import Dish

_DATA_DIR = Path(__file__).parent.parent.parent / "data"
_dishes: list[Dish] | None = None
_questions: list[dict] | None = None
_restaurants: list[dict] | None = None


def get_dishes() -> list[Dish]:
    global _dishes
    if _dishes is None:
        raw = json.loads((_DATA_DIR / "dishes.json").read_text(encoding="utf-8"))
        _dishes = [Dish(**d) for d in raw]
    return _dishes


def get_restaurants() -> list[dict]:
    global _restaurants
    if _restaurants is None:
        _restaurants = json.loads((_DATA_DIR / "restaurants.json").read_text(encoding="utf-8"))
    return _restaurants


def get_questions(lang: str = "vi") -> list[dict]:
    global _questions
    if _questions is None:
        _questions = json.loads((_DATA_DIR / "questions.json").read_text(encoding="utf-8"))

    result = []
    for q in _questions:
        result.append({
            "id": q["id"],
            "order": q["order"],
            "axis": q["axis"],
            "text": q[f"text_{lang}"] if f"text_{lang}" in q else q["text_vi"],
            "options": [
                {"value": o["value"], "label": o.get(f"label_{lang}", o["label_vi"])}
                for o in q["options"]
            ],
            "condition": q.get("condition"),
        })
    return result
