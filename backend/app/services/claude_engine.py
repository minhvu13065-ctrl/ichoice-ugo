import json
import anthropic
from app.core.config import settings
from app.models.dish import Dish
from app.models.quiz import QuizAnswers, GroupMode, Lang
from app.services.filter import dishes_to_prompt_list

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

SYSTEM_PROMPT = """Bạn là AI ẩm thực chuyên sâu của iChoice uGo — app giúp Gen Z Việt Nam chọn món trong 30 giây.

NHIỆM VỤ:
Phân tích toàn bộ câu trả lời quiz (khẩu vị, texture, tâm trạng, ngân sách, bối cảnh nhóm, hạn chế ăn uống, mức cay, môi trường ăn, sức khoẻ) → chọn ĐÚNG 1 món tối ưu nhất từ danh sách ứng viên.

LOGIC ƯU TIÊN (theo thứ tự quan trọng):
1. Hạn chế tuyệt đối (chay, dị ứng, không cay) — đã được lọc trước, nhưng vẫn ưu tiên.
2. Mức độ đói: light → chọn món nhẹ; full → chọn món no căng.
3. Vị chủ đạo + mức cay cụ thể.
4. Texture: soupy → nước nhiều; crispy → chiên/nướng; soft → cháo/hấp; fresh → gỏi/salad.
5. Bối cảnh nhóm: solo → suất đơn; couple/date → lãng mạn; friends → ăn chung; family → đa dạng.
6. Ngân sách.
7. Thời gian: quick → đồ ăn nhanh; normal → lẩu/nướng OK.
8. Tâm trạng: sad → comfort food; happy/celebrate → đồ đặc biệt.
9. Môi trường: street → vỉa hè; cozy_cafe → cà phê/snack; takeaway → đồ dễ mang.
10. Health priority: light_diet → ưu tiên salad/chay/cháo; indulge → ưu tiên đồ béo đậm đà.

PHONG CÁCH reason (Gen Z, ngắn gọn, vui):
- reason_vi: tối đa 12 từ, dùng từ ngữ trẻ trung, có thể dùng 1 emoji.
- reason_en: tối đa 12 words, casual Gen Z tone, 1 emoji OK.
- Ví dụ tốt: "Cay đã, nóng hổi — đúng mood mưa rồi! 🌧️"
- Ví dụ xấu: "Đây là món phù hợp với khẩu vị của bạn vì bạn thích cay."

QUY TẮC BẮT BUỘC:
- chosen_dish_id VÀ alternative_dish_id PHẢI nằm trong danh sách ứng viên.
- chosen_dish_id ≠ alternative_dish_id.
- confidence: 0.7–0.98 (tránh giá trị cực đoan).
- Trả về JSON THUẦN TÚY — không có markdown, không có text thừa trước/sau JSON.

FORMAT JSON:
{"chosen_dish_id":"...","confidence":0.0,"reason_vi":"...","reason_en":"...","alternative_dish_id":"..."}"""


def _build_user_prompt(
    answers: QuizAnswers,
    mode: GroupMode,
    lang: Lang,
    candidate_list: str,
    excluded_ids: list[str],
    extra: dict,
    feedback_context: str = "",
) -> str:
    excluded_note = f"\n- Món đã từ chối (KHÔNG chọn lại): {excluded_ids}" if excluded_ids else ""
    feedback_note = f"\n- Phản hồi trước: {feedback_context}" if feedback_context else ""

    extras = ""
    if extra.get("texture"):       extras += f"\n- Texture/kiểu ăn: {extra['texture']}"
    if extra.get("cuisine_sub"):   extras += f"\n- Vùng ẩm thực VN: {extra['cuisine_sub']}"
    if extra.get("spicy_level"):   extras += f"\n- Mức cay cụ thể: {extra['spicy_level']}"
    if extra.get("group_size"):    extras += f"\n- Cỡ nhóm: {extra['group_size']}"
    if extra.get("setting"):       extras += f"\n- Môi trường ăn: {extra['setting']}"
    if extra.get("health_priority"): extras += f"\n- Ưu tiên sức khoẻ: {extra['health_priority']}"
    if extra.get("want_drink"):    extras += f"\n- Muốn đồ uống: {extra['want_drink']}"

    return f"""Chế độ nhóm: {mode} | Ngôn ngữ: {lang}

Câu trả lời quiz:
- Mức đói: {answers.hunger_level}
- Nhiệt độ món: {answers.temperature}
- Vị chủ đạo: {answers.flavor or 'bất kỳ'}
- Ẩm thực: {answers.cuisine or 'bất kỳ'}
- Ngân sách: {answers.price_range}
- Thời gian: {answers.time_available}
- Tâm trạng: {answers.mood or 'bình thường'}
- Hạn chế ăn: {answers.restrictions or 'không có'}{extras}{excluded_note}{feedback_note}

Danh sách món ứng viên (chỉ được chọn trong đây):
{candidate_list}

Trả về JSON ngay, không giải thích thêm."""


def call_claude(
    answers: QuizAnswers,
    mode: GroupMode,
    lang: Lang,
    candidates: list[Dish],
    excluded_ids: list[str] = [],
    extra: dict | None = None,
    feedback_context: str = "",
) -> dict:
    candidate_list = dishes_to_prompt_list(candidates)
    user_prompt = _build_user_prompt(answers, mode, lang, candidate_list, excluded_ids, extra or {}, feedback_context)

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            temperature=0.3,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        raw = response.content[0].text.strip()
        result = json.loads(raw)

        # Validate: chosen_dish_id phải trong candidate set
        candidate_ids = {d.id for d in candidates}
        if result.get("chosen_dish_id") not in candidate_ids:
            return _fallback(candidates, excluded_ids)
        if result.get("alternative_dish_id") not in candidate_ids:
            result["alternative_dish_id"] = _pick_alternative(candidates, result["chosen_dish_id"], excluded_ids)

        return result

    except Exception:
        return _fallback(candidates, excluded_ids)


def _fallback(candidates: list[Dish], excluded_ids: list[str]) -> dict:
    """Heuristic đơn giản khi Claude API lỗi."""
    available = [d for d in candidates if d.id not in excluded_ids]
    if not available:
        available = candidates
    chosen = max(available, key=lambda d: d.avg_rating)
    alt_pool = [d for d in available if d.id != chosen.id]
    alternative = alt_pool[0].id if alt_pool else chosen.id

    return {
        "chosen_dish_id": chosen.id,
        "confidence": 0.5,
        "reason_vi": "Món được yêu thích nhất!",
        "reason_en": "Most popular dish!",
        "alternative_dish_id": alternative,
    }


def _pick_alternative(candidates: list[Dish], chosen_id: str, excluded_ids: list[str]) -> str:
    pool = [d for d in candidates if d.id != chosen_id and d.id not in excluded_ids]
    if not pool:
        pool = [d for d in candidates if d.id != chosen_id]
    return pool[0].id if pool else chosen_id
