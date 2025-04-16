# backend/src/routes/api.py

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal
from src.models.models import Cart, User, Product, Order
from src.config import settings
from src.database import get_db
from src.rabbitmq.rabbitmq_producer import publish_message
from src.schemas import (
    CartItem,
    CartResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    ProductCreate,
    ProductResponse,
    OrderCreate,
    OrderResponse
)

router = APIRouter()

# Security configurations
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  # Fixed token URL

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        email: str = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()

        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Auth endpoints
@router.post("/register", response_model=dict, tags=["auth"])
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user_data.username) |
        (User.email == user_data.email)
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        is_admin=user_data.is_admin,  # Removed user-controlled admin flag
        is_active=True   # Added activation status
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    publish_message("user_events", f"New user registered: {new_user.email}")

    return {
        "message": "User created successfully",
        "user": UserResponse.from_orm(new_user).dict()
    }

@router.post("/login", response_model=dict, tags=["auth"])
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
    response: Response = Response()
):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})

    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60,
        path="/",
        samesite="lax",    # Use 'lax' for local development
        secure=False      # Disable secure flag for HTTP
    )

    # Publish a message on successful login
    publish_message("login_events", f"User logged in: {user.email}")

    return {
        "message": "Login successful",
        "user": UserResponse.from_orm(user).dict()
    }

# User endpoints
@router.get("/users/me", response_model=UserResponse, tags=["auth"])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@router.get("/users",
            response_model=list[UserResponse],
            tags=["users"],
            dependencies=[Depends(admin_required)])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/users/{user_id}", response_model=UserResponse, tags=["users"])
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.id != user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    return user

# Product endpoints
@router.post("/products",
            response_model=dict,
            tags=["products"],
            dependencies=[Depends(admin_required)])
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db)
):
    existing_product = db.query(Product).filter(
        Product.name == product_data.name
    ).first()

    if existing_product:
        raise HTTPException(status_code=400, detail="Product exists")

    new_product = Product(
        name=product_data.name,
        price=Decimal(str(product_data.price)),  # Use Decimal for currency
        description=product_data.description,
        stock=product_data.stock
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "message": "Product created",
        "product": ProductResponse.from_orm(new_product).dict()
    }

@router.get("/products", response_model=list[ProductResponse], tags=["products"])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

# Order endpoints
@router.post("/orders", response_model=dict, tags=["orders"])
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    with db.begin():  # Transaction block
        product = db.query(Product).with_for_update().get(order_data.product_id)

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < order_data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        new_order = Order(
            product_id=product.id,
            user_id=current_user.id,
            quantity=order_data.quantity
        )

        product.stock -= order_data.quantity
        db.add(new_order)

    publish_message("order_events", f"User {current_user.id} placed order for product {product.id} (qty: {order_data.quantity})")

    return {
        "message": "Order created",
        "order": OrderResponse.from_orm(new_order).dict()
    }

# Cart endpoints
@router.post("/cart/add", response_model=dict, tags=["cart"])
def add_to_cart(
    cart_item: CartItem,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).get(cart_item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock < cart_item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    cart_item_db = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == cart_item.product_id
    ).first()

    if cart_item_db:
        cart_item_db.quantity += cart_item.quantity
    else:
        cart_item_db = Cart(
            user_id=current_user.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity
        )
        db.add(cart_item_db)

    db.commit()
    publish_message("cart_events", f"User {current_user.id} added product {product.id} (qty: {cart_item.quantity}) to cart.")
    return {"message": "Product added to cart"}

@router.get("/cart", response_model=list[CartResponse], tags=["cart"])
def get_cart(
    current_user: User = Depends(get_current_user),  # Ensure this dependency
    db: Session = Depends(get_db)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    return [CartResponse.from_orm(item) for item in cart_items]

@router.get("/healthy")
async def health_check():
    return {"status": "healthy"}
