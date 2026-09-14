"""Application Configuration"""
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # SQLite database - no external DB needed
    DATABASE_URL: str = "sqlite:///./smartroute.db"
    SECRET_KEY: str = "your-super-secret-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    FRONTEND_URL: str = "http://localhost:3000"
    APP_NAME: str = "SmartRoute"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()