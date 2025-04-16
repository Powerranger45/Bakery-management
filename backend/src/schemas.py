from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

# User Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: bool = False

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool

    class Config:
        from_attributes = True  # Allow conversion from SQLAlchemy models

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Product Schemas
class ProductCreate(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    stock: int

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: Optional[str]
    stock: int

    class Config:
        from_attributes = True

# Order Schemas
class OrderCreate(BaseModel):
    product_id: int
    quantity: int

class OrderResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    status: str

    class Config:
        from_attributes = True

# Cart Schemas
class CartItem(BaseModel):
    product_id: int
    quantity: int

class CartResponse(BaseModel):
    id: int
    product: ProductResponse
    quantity: int
    added_at: datetime

    class Config:
        from_attributes = True
