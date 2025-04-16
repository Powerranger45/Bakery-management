# backend/src/config.py

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int = 5432  # Default PostgreSQL port
    JWT_SECRET_KEY: str
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    API_KEY: str

    class Config:
        env_file = ".env"  # Load environment variables from .env
        extra = "ignore"  # Ignore extra fields in the .env file

settings = Settings()
