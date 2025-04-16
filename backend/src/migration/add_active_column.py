# src/add_is_active_column.py
from sqlalchemy import MetaData, Table, Column, Boolean
from backend.src.migration.user_settings import engine

# Reflect the existing metadata
metadata = MetaData(bind=engine)
metadata.reflect()

# Get the users table
users = metadata.tables["users"]

# Add the is_active column
def add_is_active_column():
    print("Adding is_active column to users table...")
    with engine.connect() as conn:
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
        conn.commit()
    print("is_active column added successfully.")

if __name__ == "__main__":
    add_is_active_column()
