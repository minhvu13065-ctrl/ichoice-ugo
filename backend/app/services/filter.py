from app.models.dish import Dish
from app.models.quiz import QuizAnswers, GroupMode


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
