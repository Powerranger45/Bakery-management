# backend/src/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from urllib.parse import quote_plus
from src.config import settings

# Define the Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# URL-encode the password to handle special characters
encoded_password = quote_plus(settings.DB_PASSWORD)
DATABASE_URL = f"postgresql+psycopg2://{settings.DB_USER}:{encoded_password}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
print(f"Database URL: {DATABASE_URL}")  # Debugging output

# Create a synchronous engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Logs SQL queries for debugging
    pool_size=5,  # Number of connections in the pool
    max_overflow=10  # Maximum overflow size for the pool
)

# Create a session factory for synchronous sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to provide a synchronous database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to check the database connection
def check_db_connection():
    """Synchronous function to verify the database connection."""
    try:
        with engine.connect() as conn:
            print("Database connection successful")  # Debugging output
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise
