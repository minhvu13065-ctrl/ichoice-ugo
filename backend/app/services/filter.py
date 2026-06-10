from app.models.dish import Dish
from app.models.quiz import QuizAnswers, GroupMode

FLAVOR_ATTRS = {"spicy", "sour", "sweet", "salty", "rich"}
MODE_GROUP_TAG = {"solo": "solo", "couple": "date", "friends": "share", "family": "family"}
FULLNESS_ORDER = ["light", "medium", "full"]
SPICY_LEVEL_TARGET = {"mild_spicy": 0.3, "medium_spicy": 0.6, "very_spicy": 0.9}


def hard_filter(dishes: list[Dish], answers: QuizAnswers, mode: GroupMode) -> list[Dish]:
    """Lọc cứng — loại bỏ món vi phạm ràng buộc tuyệt đối."""
    result = []
    for dish in dishes:
        attrs = dish.attributes

        # Kiểm tra hạn chế ăn uống
        if "vegan" in answers.restrictions and not attrs.is_vegan:
            continue
        if "vegetarian" in answers.restrictions and not attrs.is_vegetarian:
            continue
        if "no_meat" in answers.restrictions and "meat" in attrs.restrictions:
            continue
        if "no_seafood" in answers.restrictions and "seafood" in attrs.restrictions:
            continue
        if "no_pork" in answers.restrictions and "pork" in attrs.restrictions:
            continue
        if "no_spicy" in answers.restrictions and attrs.spicy > 0.3:
            continue

        # Kiểm tra ngân sách
        if answers.price_range != "any" and attrs.price_range != answers.price_range:
            continue

        # Kiểm tra chế độ nhóm
        if mode == "family" and attrs.spicy > 0.8:
            continue  # quá cay không hợp gia đình

        result.append(dish)

    return result if result else dishes  # fallback: trả toàn bộ nếu lọc quá chặt


def score_dish(dish: Dish, answers: QuizAnswers, mode: GroupMode, extra: dict | None = None) -> float:
    """Tính điểm phù hợp của món với câu trả lời quiz — càng cao càng khớp."""
    extra = extra or {}
    attrs = dish.attributes
    score = 0.0

    # Vị chủ đạo
    for flavor in answers.flavor:
        if flavor == "mild":
            if max(attrs.spicy, attrs.sour, attrs.sweet, attrs.salty, attrs.rich) <= 0.3:
                score += 2.0
        elif flavor in FLAVOR_ATTRS:
            score += getattr(attrs, flavor) * 2.0

    # Nhiệt độ
    if answers.temperature == "hot" and attrs.temperature == "hot":
        score += 2.0
    elif answers.temperature == "cold":
        if attrs.temperature == "cold":
            score += 2.0
        elif attrs.temperature == "room":
            score += 1.0

    # Mức đói <-> độ no
    if answers.hunger_level in FULLNESS_ORDER and attrs.fullness in FULLNESS_ORDER:
        diff = abs(FULLNESS_ORDER.index(answers.hunger_level) - FULLNESS_ORDER.index(attrs.fullness))
        score += {0: 1.5, 1: 0.5, 2: 0.0}[diff]

    # Ẩm thực
    if answers.cuisine and attrs.cuisine in answers.cuisine:
        score += 1.5

    # Bối cảnh nhóm
    tag = MODE_GROUP_TAG.get(mode)
    if tag and tag in attrs.group_tags:
        score += 1.0

    # Mức cay cụ thể
    spicy_level = extra.get("spicy_level")
    if spicy_level in SPICY_LEVEL_TARGET:
        score += max(0.0, 1.0 - abs(attrs.spicy - SPICY_LEVEL_TARGET[spicy_level])) * 1.5

    # Ưu tiên sức khoẻ
    health = extra.get("health_priority")
    if health == "light_diet" and attrs.fullness == "light" and attrs.rich <= 0.3:
        score += 1.0
    elif health == "indulge" and attrs.rich >= 0.5:
        score += 1.0

    # Độ phổ biến — tiêu chí phụ để phá thế hoà
    score += dish.avg_rating * 0.1

    return score


def rank_candidates(dishes: list[Dish], answers: QuizAnswers, mode: GroupMode, extra: dict | None = None) -> list[Dish]:
    """Sắp xếp ứng viên theo độ phù hợp giảm dần — món phù hợp nhất lên đầu."""
    return sorted(dishes, key=lambda d: score_dish(d, answers, mode, extra), reverse=True)


def dishes_to_prompt_list(dishes: list[Dish]) -> str:
    """Chuyển danh sách món thành text để đưa vào prompt Claude."""
    lines = []
    for d in dishes:
        a = d.attributes
        lines.append(
            f"- id={d.id} | {d.name_vi} / {d.name_en} | "
            f"spicy={a.spicy} sour={a.sour} sweet={a.sweet} salty={a.salty} rich={a.rich} | "
            f"temp={a.temperature} fullness={a.fullness} cuisine={a.cuisine} "
            f"price={a.price_range} tags={a.group_tags} restrictions={a.restrictions}"
        )
    return "\n".join(lines)
