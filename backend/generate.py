import os

base_dir = r"c:\Users\omerc\Desktop\academy-ecommerce\backend"

files = {
    ".env": """HOST=localhost
PORT=5433
USER=postgres
PASSWORD=123456
DB_NAME=ecommerce_db
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
""",
    "requirements.txt": """fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
pydantic
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
python-multipart
aiofiles
""",
    "main.py": """from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from core.config import settings
from api.v1.api import api_router
from core.database import engine, Base
import os

app = FastAPI()

os.makedirs("uploads/products", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
""",
    "core/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HOST: str
    PORT: int
    USER: str
    PASSWORD: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"

settings = Settings()
""",
    "core/database.py": """from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.config import settings
from models.base import Base

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
""",
    "core/security.py": """from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
""",
    "core/dependencies.py": """from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import settings
from core.database import get_db
from services.user import UserService
from repositories.user import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_repo = UserRepository(db)
    user_service = UserService(user_repo)
    user = await user_service.get_user(int(user_id))
    if user is None:
        raise credentials_exception
    return user
""",
    "models/base.py": """from sqlalchemy.orm import declarative_base
Base = declarative_base()
""",
    "models/role.py": """from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from models.base import Base

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    users = relationship("User", back_populates="role")
""",
    "models/user.py": """from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
""",
    "models/category.py": """from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from models.base import Base

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    products = relationship("Product", back_populates="category")
""",
    "models/product.py": """from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
""",
    "models/product_image.py": """from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", back_populates="images")
""",
    "models/cart.py": """from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base

class Cart(Base):
    __tablename__ = "carts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")
""",
    "models/order.py": """from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from models.base import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
""",
    "schemas/role.py": """from pydantic import BaseModel

class RoleBase(BaseModel):
    name: str

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    class Config:
        from_attributes = True
""",
    "schemas/user.py": """from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role_id: int | None = None

class UserOut(UserBase):
    id: int
    is_active: bool
    role_id: int | None = None
    class Config:
        from_attributes = True
""",
    "schemas/auth.py": """from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
""",
    "schemas/category.py": """from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True
""",
    "schemas/product_image.py": """from pydantic import BaseModel
from datetime import datetime

class ProductImageOut(BaseModel):
    id: int
    product_id: int
    image_url: str
    created_at: datetime
    class Config:
        from_attributes = True
""",
    "schemas/product.py": """from pydantic import BaseModel
from schemas.product_image import ProductImageOut

class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    images: list[ProductImageOut] = []
    class Config:
        from_attributes = True
""",
    "schemas/cart.py": """from pydantic import BaseModel

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int

class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    class Config:
        from_attributes = True

class CartOut(BaseModel):
    id: int
    user_id: int
    items: list[CartItemOut] = []
    class Config:
        from_attributes = True
""",
    "schemas/order.py": """from pydantic import BaseModel
from datetime import datetime

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []
    class Config:
        from_attributes = True
""",
    "repositories/base.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import TypeVar, Generic

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: int) -> ModelType | None:
        result = await self.db.execute(select(self.model).filter(self.model.id == id))
        return result.scalars().first()

    async def get_all(self) -> list[ModelType]:
        result = await self.db.execute(select(self.model))
        return list(result.scalars().all())

    async def create(self, obj_in: dict) -> ModelType:
        obj = self.model(**obj_in)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def delete(self, id: int) -> bool:
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
            return True
        return False
""",
    "repositories/user.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).filter(User.email == email))
        return result.scalars().first()
""",
    "repositories/role.py": """from sqlalchemy.ext.asyncio import AsyncSession
from models.role import Role
from repositories.base import BaseRepository

class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: AsyncSession):
        super().__init__(Role, db)
""",
    "repositories/category.py": """from sqlalchemy.ext.asyncio import AsyncSession
from models.category import Category
from repositories.base import BaseRepository

class CategoryRepository(BaseRepository[Category]):
    def __init__(self, db: AsyncSession):
        super().__init__(Category, db)
""",
    "repositories/product.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from models.product import Product
from repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: AsyncSession):
        super().__init__(Product, db)

    async def get_with_images(self, id: int) -> Product | None:
        result = await self.db.execute(
            select(Product).options(selectinload(Product.images)).filter(Product.id == id)
        )
        return result.scalars().first()

    async def get_all_with_images(self) -> list[Product]:
        result = await self.db.execute(select(Product).options(selectinload(Product.images)))
        return list(result.scalars().all())
""",
    "repositories/product_image.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.product_image import ProductImage
from repositories.base import BaseRepository

class ProductImageRepository(BaseRepository[ProductImage]):
    def __init__(self, db: AsyncSession):
        super().__init__(ProductImage, db)

    async def get_by_product_id(self, product_id: int) -> list[ProductImage]:
        result = await self.db.execute(select(ProductImage).filter(ProductImage.product_id == product_id))
        return list(result.scalars().all())
""",
    "repositories/cart.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.cart import Cart, CartItem
from repositories.base import BaseRepository

class CartRepository(BaseRepository[Cart]):
    def __init__(self, db: AsyncSession):
        super().__init__(Cart, db)

    async def get_by_user_id(self, user_id: int) -> Cart | None:
        result = await self.db.execute(
            select(Cart).options(selectinload(Cart.items)).filter(Cart.user_id == user_id)
        )
        return result.scalars().first()

class CartItemRepository(BaseRepository[CartItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(CartItem, db)
""",
    "repositories/order.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.order import Order, OrderItem
from repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: AsyncSession):
        super().__init__(Order, db)

    async def get_by_user_id(self, user_id: int) -> list[Order]:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).filter(Order.user_id == user_id)
        )
        return list(result.scalars().all())

class OrderItemRepository(BaseRepository[OrderItem]):
    def __init__(self, db: AsyncSession):
        super().__init__(OrderItem, db)
""",
    "services/user.py": """from repositories.user import UserRepository
from schemas.user import UserCreate
from core.security import get_password_hash

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, user_in: UserCreate):
        user_data = user_in.model_dump()
        user_data["hashed_password"] = get_password_hash(user_data.pop("password"))
        return await self.user_repo.create(user_data)

    async def get_user(self, user_id: int):
        return await self.user_repo.get(user_id)

    async def get_user_by_email(self, email: str):
        return await self.user_repo.get_by_email(email)
""",
    "services/auth.py": """from core.security import verify_password
from services.user import UserService

class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def authenticate_user(self, email: str, password: str):
        user = await self.user_service.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
""",
    "services/category.py": """from repositories.category import CategoryRepository
from schemas.category import CategoryCreate

class CategoryService:
    def __init__(self, repo: CategoryRepository):
        self.repo = repo

    async def create_category(self, cat_in: CategoryCreate):
        return await self.repo.create(cat_in.model_dump())

    async def get_all(self):
        return await self.repo.get_all()
""",
    "services/product.py": """from repositories.product import ProductRepository
from schemas.product import ProductCreate

class ProductService:
    def __init__(self, repo: ProductRepository):
        self.repo = repo

    async def create_product(self, prod_in: ProductCreate):
        return await self.repo.create(prod_in.model_dump())

    async def get_all(self):
        return await self.repo.get_all_with_images()

    async def get_product(self, id: int):
        return await self.repo.get_with_images(id)
""",
    "services/product_image.py": """import os
import uuid
import aiofiles
from fastapi import UploadFile
from repositories.product_image import ProductImageRepository

class ProductImageService:
    def __init__(self, repo: ProductImageRepository):
        self.repo = repo
        self.upload_dir = "uploads/products"
        os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_image(self, product_id: int, file: UploadFile):
        ext = file.filename.split('.')[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(self.upload_dir, filename)
        
        async with aiofiles.open(filepath, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        image_url = f"/uploads/products/{filename}"
        return await self.repo.create({"product_id": product_id, "image_url": image_url})

    async def get_by_product(self, product_id: int):
        return await self.repo.get_by_product_id(product_id)

    async def delete_image(self, image_id: int):
        image = await self.repo.get(image_id)
        if image:
            filepath = image.image_url.lstrip("/")
            if os.path.exists(filepath):
                os.remove(filepath)
            return await self.repo.delete(image_id)
        return False
""",
    "services/cart.py": """from repositories.cart import CartRepository, CartItemRepository
from schemas.cart import CartItemCreate

class CartService:
    def __init__(self, cart_repo: CartRepository, cart_item_repo: CartItemRepository):
        self.cart_repo = cart_repo
        self.cart_item_repo = cart_item_repo

    async def get_or_create_cart(self, user_id: int):
        cart = await self.cart_repo.get_by_user_id(user_id)
        if not cart:
            cart = await self.cart_repo.create({"user_id": user_id})
        return cart

    async def add_item(self, user_id: int, item: CartItemCreate):
        cart = await self.get_or_create_cart(user_id)
        return await self.cart_item_repo.create({
            "cart_id": cart.id,
            "product_id": item.product_id,
            "quantity": item.quantity
        })
""",
    "services/order.py": """from repositories.order import OrderRepository, OrderItemRepository
from repositories.cart import CartRepository
from repositories.product import ProductRepository

class OrderService:
    def __init__(self, order_repo: OrderRepository, order_item_repo: OrderItemRepository, cart_repo: CartRepository, product_repo: ProductRepository):
        self.order_repo = order_repo
        self.order_item_repo = order_item_repo
        self.cart_repo = cart_repo
        self.product_repo = product_repo

    async def create_order_from_cart(self, user_id: int):
        cart = await self.cart_repo.get_by_user_id(user_id)
        if not cart or not cart.items:
            return None

        total_price = 0.0
        order_items_data = []

        for item in cart.items:
            product = await self.product_repo.get(item.product_id)
            price = product.price * item.quantity
            total_price += price
            order_items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": product.price
            })

        order = await self.order_repo.create({"user_id": user_id, "total_price": total_price})
        
        for item_data in order_items_data:
            item_data["order_id"] = order.id
            await self.order_item_repo.create(item_data)

        await self.cart_repo.delete(cart.id)
        return order

    async def get_user_orders(self, user_id: int):
        return await self.order_repo.get_by_user_id(user_id)
""",
    "api/v1/endpoints/auth.py": """from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import create_access_token
from core.config import settings
from services.auth import AuthService
from services.user import UserService
from repositories.user import UserRepository
from schemas.auth import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user_service = UserService(user_repo)
    auth_service = AuthService(user_service)
    
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}
""",
    "api/v1/endpoints/users.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from services.user import UserService
from repositories.user import UserRepository
from schemas.user import UserCreate, UserOut
from models.user import User

router = APIRouter()

@router.post("/", response_model=UserOut)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user_service = UserService(user_repo)
    return await user_service.create_user(user_in)

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
""",
    "api/v1/endpoints/categories.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services.category import CategoryService
from repositories.category import CategoryRepository
from schemas.category import CategoryCreate, CategoryOut

router = APIRouter()

@router.post("/", response_model=CategoryOut)
async def create_category(cat_in: CategoryCreate, db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    service = CategoryService(repo)
    return await service.create_category(cat_in)

@router.get("/", response_model=list[CategoryOut])
async def get_categories(db: AsyncSession = Depends(get_db)):
    repo = CategoryRepository(db)
    service = CategoryService(repo)
    return await service.get_all()
""",
    "api/v1/endpoints/products.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services.product import ProductService
from repositories.product import ProductRepository
from schemas.product import ProductCreate, ProductOut

router = APIRouter()

@router.post("/", response_model=ProductOut)
async def create_product(prod_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    repo = ProductRepository(db)
    service = ProductService(repo)
    return await service.create_product(prod_in)

@router.get("/", response_model=list[ProductOut])
async def get_products(db: AsyncSession = Depends(get_db)):
    repo = ProductRepository(db)
    service = ProductService(repo)
    return await service.get_all()
""",
    "api/v1/endpoints/product_images.py": """from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from services.product_image import ProductImageService
from repositories.product_image import ProductImageRepository
from schemas.product_image import ProductImageOut

router = APIRouter()

@router.post("/{product_id}", response_model=ProductImageOut)
async def upload_image(product_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    repo = ProductImageRepository(db)
    service = ProductImageService(repo)
    return await service.upload_image(product_id, file)

@router.get("/{product_id}", response_model=list[ProductImageOut])
async def get_images(product_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProductImageRepository(db)
    service = ProductImageService(repo)
    return await service.get_by_product(product_id)

@router.delete("/{image_id}")
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProductImageRepository(db)
    service = ProductImageService(repo)
    success = await service.delete_image(image_id)
    return {"success": success}
""",
    "api/v1/endpoints/cart.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from services.cart import CartService
from repositories.cart import CartRepository, CartItemRepository
from schemas.cart import CartItemCreate, CartOut, CartItemOut
from models.user import User

router = APIRouter()

@router.get("/", response_model=CartOut)
async def get_cart(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart_repo = CartRepository(db)
    cart_item_repo = CartItemRepository(db)
    service = CartService(cart_repo, cart_item_repo)
    return await service.get_or_create_cart(current_user.id)

@router.post("/items", response_model=CartItemOut)
async def add_cart_item(item: CartItemCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cart_repo = CartRepository(db)
    cart_item_repo = CartItemRepository(db)
    service = CartService(cart_repo, cart_item_repo)
    return await service.add_item(current_user.id, item)
""",
    "api/v1/endpoints/orders.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user
from services.order import OrderService
from repositories.order import OrderRepository, OrderItemRepository
from repositories.cart import CartRepository
from repositories.product import ProductRepository
from schemas.order import OrderOut
from models.user import User

router = APIRouter()

@router.post("/", response_model=OrderOut)
async def create_order(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order_repo = OrderRepository(db)
    order_item_repo = OrderItemRepository(db)
    cart_repo = CartRepository(db)
    product_repo = ProductRepository(db)
    service = OrderService(order_repo, order_item_repo, cart_repo, product_repo)
    
    order = await service.create_order_from_cart(current_user.id)
    if not order:
        raise HTTPException(status_code=400, detail="Cart is empty")
    return order

@router.get("/", response_model=list[OrderOut])
async def get_orders(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    order_repo = OrderRepository(db)
    order_item_repo = OrderItemRepository(db)
    cart_repo = CartRepository(db)
    product_repo = ProductRepository(db)
    service = OrderService(order_repo, order_item_repo, cart_repo, product_repo)
    
    return await service.get_user_orders(current_user.id)
""",
    "api/v1/api.py": """from fastapi import APIRouter
from api.v1.endpoints import auth, users, categories, products, product_images, cart, orders

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(product_images.router, prefix="/product-images", tags=["product images"])
api_router.include_router(cart.router, prefix="/cart", tags=["cart"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
"""
}

for rel_path, content in files.items():
    full_path = os.path.join(base_dir, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\\n")
