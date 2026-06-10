"""In-memory session store cho MVP (thay bằng Redis/DB sau)."""
from dataclasses import dataclass, field
from app.models.quiz import QuizAnswers, GroupMode, Lang


@dataclass
class Session:
    session_id: str
    answers: QuizAnswers
    mode: GroupMode
    lang: Lang
    chosen_dish_id: str = ""
    alternative_dish_id: str = ""
    excluded_ids: list[str] = field(default_factory=list)
    swap_count: int = 0


_store: dict[str, Session] = {}


def save_session(session: Session) -> None:
    _store[session.session_id] = session


def get_session(session_id: str) -> Session | None:
    return _store.get(session_id)


def mark_excluded(session_id: str, dish_id: str) -> None:
    session = _store.get(session_id)
    if session and dish_id not in session.excluded_ids:
        session.excluded_ids.append(dish_id)
        session.swap_count += 1
