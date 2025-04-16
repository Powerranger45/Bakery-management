# src/initial_tables.py
from sqlalchemy import MetaData, Table, Column, Integer, String, Boolean
from backend.src.migration.user_settings import engine

# Define metadata
metadata = MetaData()

# Define the initial users table
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("username", String, unique=True, nullable=False),
    Column("email", String, unique=True, nullable=False),
    Column("password_hash", String, nullable=False),
)

# Create all tables
def create_initial_tables():
    print("Creating initial tables...")
    metadata.create_all(engine)
    print("Initial tables created successfully.")

if __name__ == "__main__":
    create_initial_tables()
