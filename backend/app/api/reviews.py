import uuid
from fastapi import APIRouter, HTTPException
from app.models.review import ReviewCreate, ReviewResponse
from app.services.data_loader import get_dishes

router = APIRouter(prefix="/api", tags=["reviews"])

# In-memory store cho MVP
_reviews: dict[str, list[dict]] = {}  # dish_id -> list of reviews
_rate_limit: dict[str, int] = {}      # session_id -> review count


@router.post("/reviews", response_model=ReviewResponse)
def create_review(review: ReviewCreate):
    # Giới hạn spam: mỗi session tối đa 10 đánh giá
    count = _rate_limit.get(review.session_id, 0)
    if count >= 10:
        raise HTTPException(status_code=429, detail="Too many reviews from this session")

    dishes = {d.id: d for d in get_dishes()}
    if review.dish_id not in dishes:
        raise HTTPException(status_code=404, detail="Dish not found")

    entry = {
        "id": str(uuid.uuid4()),
        "session_id": review.session_id,
        "dish_id": review.dish_id,
        "stars": review.stars,
        "tags": review.tags,
        "comment": review.comment,
    }
    _reviews.setdefault(review.dish_id, []).append(entry)
    _rate_limit[review.session_id] = count + 1

    dish_reviews = _reviews[review.dish_id]
    avg = sum(r["stars"] for r in dish_reviews) / len(dish_reviews)
    return ReviewResponse(
        id=entry["id"],
        dish_id=review.dish_id,
        stars=round(avg, 2),
        review_count=len(dish_reviews),
    )


@router.get("/dishes/{dish_id}/reviews")
def get_reviews(dish_id: str):
    return {"dish_id": dish_id, "reviews": _reviews.get(dish_id, [])}
