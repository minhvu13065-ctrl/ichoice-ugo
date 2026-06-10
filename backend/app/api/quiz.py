from fastapi import APIRouter, Query
from app.services.data_loader import get_questions

router = APIRouter(prefix="/api", tags=["quiz"])


@router.get("/quiz/questions")
def questions(
    mode: str = Query("solo"),
    lang: str = Query("vi"),
):
    qs = get_questions(lang)

    filtered = []
    for q in qs:
        cond = q.get("condition") or {}

        # Lọc theo mode dựa trên condition.not_mode (string hoặc list)
        not_modes = cond.get("not_mode")
        if not_modes:
            if isinstance(not_modes, str):
                not_modes = [not_modes]
            if mode in not_modes:
                continue

        # Câu hỏi conditional theo axis (q_cuisine_vn, q_spicy_level...)
        # được giữ lại — frontend sẽ tự ẩn nếu chưa thoả điều kiện.
        filtered.append(q)

    return {"questions": filtered, "mode": mode, "lang": lang}
