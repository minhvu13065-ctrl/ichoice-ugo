from fastapi import APIRouter, Query
from app.services.data_loader import get_questions

router = APIRouter(prefix="/api", tags=["quiz"])

# Câu hỏi chỉ hiện cho mode nhóm (không phải solo)
GROUP_ONLY = {"q_mood", "q_group_size"}
# Câu hỏi chỉ hiện cho mode solo
SOLO_ONLY: set[str] = set()
# Câu hỏi conditional (xử lý ở frontend dựa trên answer trước)
CONDITIONAL = {"q_cuisine_vn", "q_spicy_level"}


@router.get("/quiz/questions")
def questions(
    mode: str = Query("solo"),
    lang: str = Query("vi"),
):
    qs = get_questions(lang)

    filtered = []
    for q in qs:
        cond = q.get("condition")

        # Lọc theo mode
        if mode == "solo" and q["id"] in GROUP_ONLY:
            continue
        if mode != "solo" and q["id"] in SOLO_ONLY:
            continue

        # Giữ conditional questions — frontend sẽ tự ẩn nếu không thoả điều kiện
        filtered.append(q)

    return {"questions": filtered, "mode": mode, "lang": lang}
