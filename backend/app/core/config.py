from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhysioAI Backend"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "a-very-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DATABASE_URL: str = "sqlite:///./physioai.db"
    GROQ_API_KEY: str = "your-groq-api-key-here"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
