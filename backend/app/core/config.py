from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhysioAI Backend"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "a-very-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DATABASE_URL: str = "sqlite:///./physioai.db"
    
    GEMINI_API_KEY: str = "your_key_here"
    GEMINI_MODEL: str = "gemini-flash-latest"
    # Tried in order if GEMINI_MODEL is busy or unavailable
    GEMINI_FALLBACK_MODELS: str = "gemini-3.5-flash,gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL")
    @classmethod
    def fix_postgres_scheme(cls, v: str) -> str:
        # Some hosts give "postgres://", but SQLAlchemy only accepts "postgresql://"
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

settings = Settings()
