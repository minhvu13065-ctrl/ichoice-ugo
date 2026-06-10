from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ichoice_ugo"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MAX_SWAP_COUNT: int = 3  # giới hạn số lần "Đổi món khác"

    class Config:
        env_file = ".env"


settings = Settings()
