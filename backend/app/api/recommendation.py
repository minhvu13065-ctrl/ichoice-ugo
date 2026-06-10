from fastapi import APIRouter, HTTPException
from app.models.quiz import RecommendationRequest, SwapRequest, RecommendationResponse
from app.services.data_loader import get_dishes
from app.services.filter import hard_filter
from app.services.claude_engine import call_claude
from app.services.session_store import Session, save_session, get_session, mark_excluded
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["recommendation"])


def _build_response(result: dict, session_id: str) -> RecommendationResponse:
    dishes = {d.id: d for d in get_dishes()}
    chosen = dishes[result["chosen_dish_id"]]
    return RecommendationResponse(
        dish_id=chosen.id,
        name_vi=chosen.name_vi,
        name_en=chosen.name_en,
        image_url=chosen.image_url,
        confidence=result["confidence"],
        reason_vi=result["reason_vi"],
        reason_en=result["reason_en"],
        session_id=session_id,
    )


@router.post("/recommendation", response_model=RecommendationResponse)
def recommend(req: RecommendationRequest):
    all_dishes = get_dishes()
    candidates = hard_filter(all_dishes, req.answers, req.mode)
    result = call_claude(req.answers, req.mode, req.lang, candidates, extra=req.extra)

    session = Session(
        session_id=req.session_id,
        answers=req.answers,
        mode=req.mode,
        lang=req.lang,
        chosen_dish_id=result["chosen_dish_id"],
        alternative_dish_id=result.get("alternative_dish_id", ""),
    )
    save_session(session)
    return _build_response(result, req.session_id)


@router.post("/recommendation/another", response_model=RecommendationResponse)
def swap(req: SwapRequest):
    session = get_session(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.swap_count >= settings.MAX_SWAP_COUNT:
        raise HTTPException(status_code=429, detail="Swap limit reached")

    # Đánh dấu món hiện tại là đã từ chối
    mark_excluded(req.session_id, session.chosen_dish_id)
    session = get_session(req.session_id)

    # Kiểm tra alternative trước (nhanh, không gọi API)
    if session.alternative_dish_id and session.alternative_dish_id not in session.excluded_ids:
        dishes = {d.id: d for d in get_dishes()}
        alt = dishes.get(session.alternative_dish_id)
        if alt:
            session.chosen_dish_id = alt.id
            save_session(session)
            return RecommendationResponse(
                dish_id=alt.id,
                name_vi=alt.name_vi,
                name_en=alt.name_en,
                image_url=alt.image_url,
                confidence=0.75,
                reason_vi="Đây là lựa chọn thay thế cho bạn!",
                reason_en="Here's your alternative pick!",
                session_id=req.session_id,
            )

    # Gọi lại Claude với excluded list
    all_dishes = get_dishes()
    candidates = hard_filter(all_dishes, session.answers, session.mode)
    result = call_claude(session.answers, session.mode, req.lang, candidates, session.excluded_ids)
    session.chosen_dish_id = result["chosen_dish_id"]
    session.alternative_dish_id = result.get("alternative_dish_id", "")
    save_session(session)
    return _build_response(result, req.session_id)
