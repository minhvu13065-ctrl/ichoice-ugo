from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import quiz, recommendation, reviews, places

app = FastAPI(title="iChoice uGo API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz.router)
app.include_router(recommendation.router)
app.include_router(reviews.router)
app.include_router(places.router)


@app.get("/health")
def health():
    return {"status": "ok"}
