import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CODE RED – SUSTAINIQ"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    # Supports PostgreSQL via environment variable, defaults to SQLite for zero-config runnability
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./codered.db")
    
    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sustainiq-hackathon-super-secret-key-2026-antigravity")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "*"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
