# src/add_cart_table.py
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey
from backend.src.migration.user_settings import engine

# Define metadata
metadata = MetaData()

# Define the cart table
cart = Table(
    "cart",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("product_name", String, nullable=False),
    Column("quantity", Integer, nullable=False),
)

# Create the cart table
def create_cart_table():
    print("Creating cart table...")
    cart.metadata.create_all(engine)
    print("Cart table created successfully.")

if __name__ == "__main__":
    create_cart_table()
