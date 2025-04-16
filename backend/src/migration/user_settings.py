# src/user_settings.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.config import settings  # Assuming you have a config file for environment variables

# Database URL from environment variables
DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Define a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Helper function to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
