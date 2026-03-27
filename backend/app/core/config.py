from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path
import os

env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CleanBLR API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    POSTGRES_USER: str = "cleanblr_admin"
    POSTGRES_PASSWORD: str = "securepassword123"
    POSTGRES_DB: str = "cleanblr"
    DATABASE_URL: str = "postgresql+asyncpg://cleanblr_admin:securepassword123@localhost:5432/cleanblr"
    
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ML_SERVICE_URL: str = "http://localhost:8001/ml/detect"

    STORAGE_PROVIDER: str = "mock"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = str(env_path) if env_path.exists() else None

settings = Settings()
