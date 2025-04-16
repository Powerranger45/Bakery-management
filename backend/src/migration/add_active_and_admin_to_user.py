# src/add_is_active_and_is_admin_to_users.py
from sqlalchemy import MetaData, Table, Column, Boolean
from backend.src.migration.user_settings import engine

# Reflect the existing metadata
metadata = MetaData(bind=engine)
metadata.reflect()

# Get the users table
users = metadata.tables["users"]

# Add the is_active and is_admin columns
def add_is_active_and_is_admin_columns():
    print("Adding is_active and is_admin columns to users table...")
    with engine.connect() as conn:
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
        conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;")
        conn.commit()
    print("is_active and is_admin columns added successfully.")

if __name__ == "__main__":
    add_is_active_and_is_admin_columns()
