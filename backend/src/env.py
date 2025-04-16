import os
import sys
from pathlib import Path
from src.user_settings import engine
from sqlalchemy import MetaData

# Add the project root directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

# Import your migration scripts
from user_settings import engine
from initial_tables import create_initial_tables
from add_active_column import add_is_active_column
from add_active_and_admin_to_user import add_is_active_and_is_admin_columns
from cart_table import create_cart_table

def run_migrations():
    """
    Execute all migration scripts in sequence.
    """
    print("Running database migrations...")

    # Step 1: Create initial tables
    print("Step 1: Creating initial tables...")
    create_initial_tables()

    # Step 2: Add `is_active` column to users table
    print("Step 2: Adding `is_active` column to users table...")
    add_is_active_column()

    # Step 3: Add `is_active` and `is_admin` columns to users table
    print("Step 3: Adding `is_active` and `is_admin` columns to users table...")
    add_is_active_and_is_admin_columns()

    # Step 4: Create the cart table
    print("Step 4: Creating the cart table...")
    create_cart_table()

    print("All migrations completed successfully.")

if __name__ == "__main__":
    # Run migrations when this script is executed directly
    run_migrations()
