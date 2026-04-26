# E-Commerce FastAPI Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-level domain-based FastAPI e-commerce backend with JWT auth, async PostgreSQL, Alembic migrations, and image upload support.

**Architecture:** Domain-based modules under `app/` — each domain owns its model, schema, repository, service, and router. DI factory functions live inside each domain's router. Async SQLAlchemy throughout, Alembic for migrations, lifespan startup for seeding.

**Tech Stack:** FastAPI, SQLAlchemy (async) + asyncpg, Alembic, Pydantic v2, python-jose, passlib/bcrypt, aiofiles, uvicorn, pytest + pytest-asyncio + httpx

---

## File Map

```
backend/
├── app/
│   ├── __init__.py
│   ├── api.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── roles/
│   │   ├── __init__.py
│   │   └── model.py
│   ├── users/
│   │   ├── __init__.py
│   │   ├── model.py, schema.py, repository.py, service.py, router.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── schema.py, service.py, router.py
│   ├── categories/
│   │   ├── __init__.py
│   │   ├── model.py, schema.py, repository.py, service.py, router.py
│   ├── product_images/          ← must come before products (products imports schema)
│   │   ├── __init__.py
│   │   ├── model.py, schema.py, repository.py, service.py, router.py
│   ├── products/
│   │   ├── __init__.py
│   │   ├── model.py, schema.py, repository.py, service.py, router.py
│   ├── cart/
│   │   ├── __init__.py
│   │   ├── model.py, schema.py, repository.py, service.py, router.py
│   └── orders/
│       ├── __init__.py
│       ├── model.py, schema.py, repository.py, service.py, router.py
├── alembic/
│   ├── env.py
│   └── versions/
├── alembic.ini
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_database.py
│   ├── test_security.py
│   ├── test_users.py
│   ├── test_auth.py
│   └── test_products.py
├── pytest.ini
├── .env
├── main.py
└── requirements.txt
```

---

### Task 1: Project Scaffold — Config, .env, requirements.txt

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env`
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`

- [ ] **Step 1: Create requirements.txt**

`backend/requirements.txt`:

```
fastapi
uvicorn[standard]
sqlalchemy[asyncio]
asyncpg
alembic
pydantic[email]
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
python-multipart
aiofiles
pytest
pytest-asyncio
httpx
aiosqlite
```

- [ ] **Step 2: Create .env**

`backend/.env`:

```
HOST=localhost
PORT=5433
USER=postgres
PASSWORD=123456
DB_NAME=ecommerce_db
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

- [ ] **Step 3: Create empty package init files**

`backend/app/__init__.py` — empty  
`backend/app/core/__init__.py` — empty

- [ ] **Step 4: Create app/core/config.py**

```python
from pydantic_settings import BaseSettings


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

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 5: Install dependencies**

```bash
cd backend
pip install -r requirements.txt
```

Expected: all packages install without error.

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/.env backend/app/__init__.py backend/app/core/__init__.py backend/app/core/config.py
git commit -m "feat: scaffold project config and settings"
```

---

### Task 2: Core — Database

**Files:**
- Create: `backend/app/core/database.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_database.py`
- Create: `backend/pytest.ini`

- [ ] **Step 1: Write failing test**

`backend/tests/__init__.py` — empty

`backend/pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
```

`backend/tests/conftest.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
```

`backend/tests/test_database.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_db_session_is_async(db_session):
    assert isinstance(db_session, AsyncSession)
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
pytest tests/test_database.py -v
```

Expected: `ImportError` — `app.core.database` not yet created.

- [ ] **Step 3: Create app/core/database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd backend
pytest tests/test_database.py -v
```

Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/database.py backend/tests/__init__.py backend/tests/conftest.py backend/tests/test_database.py backend/pytest.ini
git commit -m "feat: add async database engine and session"
```

---

### Task 3: Core — Security

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/tests/test_security.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_security.py`:
```python
from app.core.security import get_password_hash, verify_password, create_access_token


def test_password_hash_and_verify():
    hashed = get_password_hash("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_create_access_token_returns_string():
    token = create_access_token({"sub": "42"})
    assert isinstance(token, str)
    assert len(token) > 0
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
pytest tests/test_security.py -v
```

Expected: `ImportError`

- [ ] **Step 3: Create app/core/security.py**

```python
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd backend
pytest tests/test_security.py -v
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/security.py backend/tests/test_security.py
git commit -m "feat: add JWT and bcrypt security utilities"
```

---

### Task 4: Roles Model

**Files:**
- Create: `backend/app/roles/__init__.py`
- Create: `backend/app/roles/model.py`

- [ ] **Step 1: Create app/roles/__init__.py** — empty

- [ ] **Step 2: Create app/roles/model.py**

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    users = relationship("User", back_populates="role")
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/roles/
git commit -m "feat: add Role model"
```

---

### Task 5: Users Domain

**Files:**
- Create: `backend/app/users/__init__.py`
- Create: `backend/app/users/model.py`
- Create: `backend/app/users/schema.py`
- Create: `backend/app/users/repository.py`
- Create: `backend/app/users/service.py`
- Create: `backend/app/users/router.py`
- Create: `backend/tests/test_users.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_users.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.roles.model import Role
from app.users.model import User
from app.users.repository import UserRepository
from app.users.service import UserService
from app.users.schema import UserCreate

TEST_DB = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def session():
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


@pytest.mark.asyncio
async def test_create_user_hashes_password(session):
    role = Role(name="customer")
    session.add(role)
    await session.commit()
    await session.refresh(role)

    service = UserService(UserRepository(session))
    user = await service.create_user(UserCreate(email="test@example.com", password="pass", role_id=role.id))
    assert user.id is not None
    assert user.hashed_password != "pass"


@pytest.mark.asyncio
async def test_get_user_by_email(session):
    service = UserService(UserRepository(session))
    await service.create_user(UserCreate(email="find@example.com", password="pass"))
    found = await service.get_user_by_email("find@example.com")
    assert found is not None
    assert found.email == "find@example.com"
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
pytest tests/test_users.py -v
```

Expected: `ImportError`

- [ ] **Step 3: Create app/users/__init__.py** — empty

- [ ] **Step 4: Create app/users/model.py**

```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)

    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
```

- [ ] **Step 5: Create app/users/schema.py**

```python
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_id: int | None = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    role_id: int | None = None

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create app/users/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.model import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, user_id: int) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, data: dict) -> User:
        user = User(**data)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
```

- [ ] **Step 7: Create app/users/service.py**

```python
from app.users.repository import UserRepository
from app.users.schema import UserCreate
from app.core.security import get_password_hash


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, user_in: UserCreate):
        data = user_in.model_dump()
        data["hashed_password"] = get_password_hash(data.pop("password"))
        return await self.repo.create(data)

    async def get_user(self, user_id: int):
        return await self.repo.get(user_id)

    async def get_user_by_email(self, email: str):
        return await self.repo.get_by_email(email)
```

- [ ] **Step 8: Create app/users/router.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.users.repository import UserRepository
from app.users.service import UserService
from app.users.schema import UserCreate, UserOut
from app.users.model import User

router = APIRouter()


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.post("/", response_model=UserOut, status_code=201)
async def register(user_in: UserCreate, service: UserService = Depends(get_user_service)):
    return await service.create_user(user_in)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
```

- [ ] **Step 9: Run test — expect pass**

```bash
cd backend
pytest tests/test_users.py -v
```

Expected: PASS (2 tests)

- [ ] **Step 10: Commit**

```bash
git add backend/app/users/ backend/tests/test_users.py
git commit -m "feat: add users domain"
```

---

### Task 6: Auth Domain + core/dependencies.py

**Files:**
- Create: `backend/app/auth/__init__.py`
- Create: `backend/app/auth/schema.py`
- Create: `backend/app/auth/service.py`
- Create: `backend/app/auth/router.py`
- Create: `backend/app/core/dependencies.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_auth.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.roles.model import Role
from app.users.model import User
from app.users.repository import UserRepository
from app.users.service import UserService
from app.users.schema import UserCreate
from app.auth.service import AuthService

TEST_DB = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def session():
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


@pytest.mark.asyncio
async def test_authenticate_success(session):
    user_service = UserService(UserRepository(session))
    await user_service.create_user(UserCreate(email="auth@test.com", password="secret"))
    auth_service = AuthService(user_service)
    user = await auth_service.authenticate("auth@test.com", "secret")
    assert user is not None


@pytest.mark.asyncio
async def test_authenticate_wrong_password(session):
    user_service = UserService(UserRepository(session))
    await user_service.create_user(UserCreate(email="auth2@test.com", password="secret"))
    auth_service = AuthService(user_service)
    result = await auth_service.authenticate("auth2@test.com", "wrong")
    assert result is None
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: `ImportError`

- [ ] **Step 3: Create app/auth/__init__.py** — empty

- [ ] **Step 4: Create app/auth/schema.py**

```python
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
```

- [ ] **Step 5: Create app/auth/service.py**

```python
from app.users.service import UserService
from app.core.security import verify_password


class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def authenticate(self, email: str, password: str):
        user = await self.user_service.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
```

- [ ] **Step 6: Create app/core/dependencies.py**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.users.repository import UserRepository
from app.users.service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise exc
    except JWTError:
        raise exc
    user = await UserService(UserRepository(db)).get_user(int(user_id))
    if user is None:
        raise exc
    return user
```

- [ ] **Step 7: Create app/auth/router.py**

```python
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.users.repository import UserRepository
from app.users.service import UserService
from app.auth.service import AuthService
from app.auth.schema import Token

router = APIRouter()


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(UserService(UserRepository(db)))


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
):
    user = await auth_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token = create_access_token(
        {"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}
```

- [ ] **Step 8: Run test — expect pass**

```bash
cd backend
pytest tests/test_auth.py -v
```

Expected: PASS (2 tests)

- [ ] **Step 9: Commit**

```bash
git add backend/app/auth/ backend/app/core/dependencies.py backend/tests/test_auth.py
git commit -m "feat: add auth domain and JWT dependency"
```

---

### Task 7: Categories Domain

**Files:**
- Create: `backend/app/categories/__init__.py`
- Create: `backend/app/categories/model.py`
- Create: `backend/app/categories/schema.py`
- Create: `backend/app/categories/repository.py`
- Create: `backend/app/categories/service.py`
- Create: `backend/app/categories/router.py`

- [ ] **Step 1: Create app/categories/__init__.py** — empty

- [ ] **Step 2: Create app/categories/model.py**

```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    products = relationship("Product", back_populates="category")
```

- [ ] **Step 3: Create app/categories/schema.py**

```python
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create app/categories/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.categories.model import Category


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Category]:
        result = await self.db.execute(select(Category))
        return list(result.scalars().all())

    async def create(self, data: dict) -> Category:
        obj = Category(**data)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
```

- [ ] **Step 5: Create app/categories/service.py**

```python
from app.categories.repository import CategoryRepository
from app.categories.schema import CategoryCreate


class CategoryService:
    def __init__(self, repo: CategoryRepository):
        self.repo = repo

    async def create(self, data: CategoryCreate):
        return await self.repo.create(data.model_dump())

    async def get_all(self):
        return await self.repo.get_all()
```

- [ ] **Step 6: Create app/categories/router.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.categories.repository import CategoryRepository
from app.categories.service import CategoryService
from app.categories.schema import CategoryCreate, CategoryOut

router = APIRouter()


def get_category_service(db: AsyncSession = Depends(get_db)) -> CategoryService:
    return CategoryService(CategoryRepository(db))


@router.post("/", response_model=CategoryOut, status_code=201)
async def create_category(data: CategoryCreate, service: CategoryService = Depends(get_category_service)):
    return await service.create(data)


@router.get("/", response_model=list[CategoryOut])
async def list_categories(service: CategoryService = Depends(get_category_service)):
    return await service.get_all()
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/categories/
git commit -m "feat: add categories domain"
```

---

### Task 8: Product Images Domain

**Note:** This task must be completed BEFORE Task 9 (Products) because `products/schema.py` imports `ProductImageOut` from this domain.

**Files:**
- Create: `backend/app/product_images/__init__.py`
- Create: `backend/app/product_images/model.py`
- Create: `backend/app/product_images/schema.py`
- Create: `backend/app/product_images/repository.py`
- Create: `backend/app/product_images/service.py`
- Create: `backend/app/product_images/router.py`

- [ ] **Step 1: Create app/product_images/__init__.py** — empty

- [ ] **Step 2: Create app/product_images/model.py**

```python
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="images")
```

- [ ] **Step 3: Create app/product_images/schema.py**

```python
from datetime import datetime
from pydantic import BaseModel


class ProductImageOut(BaseModel):
    id: int
    product_id: int
    image_url: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create app/product_images/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.product_images.model import ProductImage


class ProductImageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> ProductImage:
        obj = ProductImage(**data)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get(self, image_id: int) -> ProductImage | None:
        result = await self.db.execute(select(ProductImage).where(ProductImage.id == image_id))
        return result.scalars().first()

    async def get_by_product(self, product_id: int) -> list[ProductImage]:
        result = await self.db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )
        return list(result.scalars().all())

    async def delete(self, image_id: int) -> bool:
        obj = await self.get(image_id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
            return True
        return False
```

- [ ] **Step 5: Create app/product_images/service.py**

```python
import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.product_images.repository import ProductImageRepository

UPLOAD_DIR = "uploads/products"


class ProductImageService:
    def __init__(self, repo: ProductImageRepository):
        self.repo = repo

    async def upload(self, product_id: int, file: UploadFile):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        return await self.repo.create({"product_id": product_id, "image_url": f"/uploads/products/{filename}"})

    async def get_by_product(self, product_id: int):
        return await self.repo.get_by_product(product_id)

    async def delete(self, image_id: int) -> bool:
        image = await self.repo.get(image_id)
        if image:
            filepath = image.image_url.lstrip("/")
            if os.path.exists(filepath):
                os.remove(filepath)
        return await self.repo.delete(image_id)
```

- [ ] **Step 6: Create app/product_images/router.py**

```python
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.product_images.repository import ProductImageRepository
from app.product_images.service import ProductImageService
from app.product_images.schema import ProductImageOut

router = APIRouter()


def get_image_service(db: AsyncSession = Depends(get_db)) -> ProductImageService:
    return ProductImageService(ProductImageRepository(db))


@router.post("/{product_id}", response_model=ProductImageOut, status_code=201)
async def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    service: ProductImageService = Depends(get_image_service),
):
    return await service.upload(product_id, file)


@router.get("/{product_id}", response_model=list[ProductImageOut])
async def list_images(product_id: int, service: ProductImageService = Depends(get_image_service)):
    return await service.get_by_product(product_id)


@router.delete("/{image_id}")
async def delete_image(image_id: int, service: ProductImageService = Depends(get_image_service)):
    return {"deleted": await service.delete(image_id)}
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/product_images/
git commit -m "feat: add product_images domain with file upload"
```

---

### Task 9: Products Domain

**Files:**
- Create: `backend/app/products/__init__.py`
- Create: `backend/app/products/model.py`
- Create: `backend/app/products/schema.py`
- Create: `backend/app/products/repository.py`
- Create: `backend/app/products/service.py`
- Create: `backend/app/products/router.py`
- Create: `backend/tests/test_products.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_products.py`:
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.categories.model import Category
from app.product_images.model import ProductImage
from app.products.model import Product
from app.products.repository import ProductRepository
from app.products.service import ProductService
from app.products.schema import ProductCreate

TEST_DB = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def session():
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


@pytest.mark.asyncio
async def test_create_product(session):
    cat = Category(name="Electronics")
    session.add(cat)
    await session.commit()
    await session.refresh(cat)

    service = ProductService(ProductRepository(session))
    product = await service.create(ProductCreate(name="Phone", price=999.0, category_id=cat.id))
    assert product.id is not None
    assert product.name == "Phone"


@pytest.mark.asyncio
async def test_get_product_with_empty_images(session):
    cat = Category(name="Laptops")
    session.add(cat)
    await session.commit()
    await session.refresh(cat)

    service = ProductService(ProductRepository(session))
    created = await service.create(ProductCreate(name="Laptop", price=1299.0, category_id=cat.id))
    fetched = await service.get(created.id)
    assert fetched.images == []
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
pytest tests/test_products.py -v
```

Expected: `ImportError`

- [ ] **Step 3: Create app/products/__init__.py** — empty

- [ ] **Step 4: Create app/products/model.py**

```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
```

- [ ] **Step 5: Create app/products/schema.py**

```python
from pydantic import BaseModel
from app.product_images.schema import ProductImageOut


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category_id: int


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    category_id: int | None
    images: list[ProductImageOut] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create app/products/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.products.model import Product


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Product:
        obj = Product(**data)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj

    async def get(self, product_id: int) -> Product | None:
        result = await self.db.execute(
            select(Product).options(selectinload(Product.images)).where(Product.id == product_id)
        )
        return result.scalars().first()

    async def get_all(self) -> list[Product]:
        result = await self.db.execute(
            select(Product).options(selectinload(Product.images))
        )
        return list(result.scalars().all())
```

- [ ] **Step 7: Create app/products/service.py**

```python
from app.products.repository import ProductRepository
from app.products.schema import ProductCreate


class ProductService:
    def __init__(self, repo: ProductRepository):
        self.repo = repo

    async def create(self, data: ProductCreate):
        return await self.repo.create(data.model_dump())

    async def get(self, product_id: int):
        return await self.repo.get(product_id)

    async def get_all(self):
        return await self.repo.get_all()
```

- [ ] **Step 8: Create app/products/router.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.repository import ProductRepository
from app.products.service import ProductService
from app.products.schema import ProductCreate, ProductOut

router = APIRouter()


def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db))


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(data: ProductCreate, service: ProductService = Depends(get_product_service)):
    return await service.create(data)


@router.get("/", response_model=list[ProductOut])
async def list_products(service: ProductService = Depends(get_product_service)):
    return await service.get_all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, service: ProductService = Depends(get_product_service)):
    product = await service.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
```

- [ ] **Step 9: Run test — expect pass**

```bash
cd backend
pytest tests/test_products.py -v
```

Expected: PASS (2 tests)

- [ ] **Step 10: Commit**

```bash
git add backend/app/products/ backend/tests/test_products.py
git commit -m "feat: add products domain"
```

---

### Task 10: Cart Domain

**Files:**
- Create: `backend/app/cart/__init__.py`
- Create: `backend/app/cart/model.py`
- Create: `backend/app/cart/schema.py`
- Create: `backend/app/cart/repository.py`
- Create: `backend/app/cart/service.py`
- Create: `backend/app/cart/router.py`

- [ ] **Step 1: Create app/cart/__init__.py** — empty

- [ ] **Step 2: Create app/cart/model.py**

```python
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


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
```

- [ ] **Step 3: Create app/cart/schema.py**

```python
from pydantic import BaseModel


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int


class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    id: int
    user_id: int
    items: list[CartItemOut] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create app/cart/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.cart.model import Cart, CartItem


class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: int) -> Cart | None:
        result = await self.db.execute(
            select(Cart).options(selectinload(Cart.items)).where(Cart.user_id == user_id)
        )
        return result.scalars().first()

    async def create(self, user_id: int) -> Cart:
        cart = Cart(user_id=user_id)
        self.db.add(cart)
        await self.db.commit()
        await self.db.refresh(cart)
        return cart

    async def delete(self, cart_id: int) -> None:
        result = await self.db.execute(select(Cart).where(Cart.id == cart_id))
        cart = result.scalars().first()
        if cart:
            await self.db.delete(cart)
            await self.db.commit()


class CartItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> CartItem:
        item = CartItem(**data)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
```

- [ ] **Step 5: Create app/cart/service.py**

```python
from app.cart.repository import CartRepository, CartItemRepository
from app.cart.schema import CartItemCreate


class CartService:
    def __init__(self, cart_repo: CartRepository, item_repo: CartItemRepository):
        self.cart_repo = cart_repo
        self.item_repo = item_repo

    async def get_or_create(self, user_id: int):
        cart = await self.cart_repo.get_by_user(user_id)
        if not cart:
            cart = await self.cart_repo.create(user_id)
        return cart

    async def add_item(self, user_id: int, item: CartItemCreate):
        cart = await self.get_or_create(user_id)
        return await self.item_repo.create({
            "cart_id": cart.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
        })
```

- [ ] **Step 6: Create app/cart/router.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.cart.repository import CartRepository, CartItemRepository
from app.cart.service import CartService
from app.cart.schema import CartItemCreate, CartItemOut, CartOut
from app.users.model import User

router = APIRouter()


def get_cart_service(db: AsyncSession = Depends(get_db)) -> CartService:
    return CartService(CartRepository(db), CartItemRepository(db))


@router.get("/", response_model=CartOut)
async def get_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    return await service.get_or_create(current_user.id)


@router.post("/items", response_model=CartItemOut, status_code=201)
async def add_item(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    return await service.add_item(current_user.id, item)
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/cart/
git commit -m "feat: add cart domain"
```

---

### Task 11: Orders Domain

**Files:**
- Create: `backend/app/orders/__init__.py`
- Create: `backend/app/orders/model.py`
- Create: `backend/app/orders/schema.py`
- Create: `backend/app/orders/repository.py`
- Create: `backend/app/orders/service.py`
- Create: `backend/app/orders/router.py`

- [ ] **Step 1: Create app/orders/__init__.py** — empty

- [ ] **Step 2: Create app/orders/model.py**

```python
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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
```

- [ ] **Step 3: Create app/orders/schema.py**

```python
from datetime import datetime
from pydantic import BaseModel


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create app/orders/repository.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.orders.model import Order, OrderItem


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Order:
        order = Order(**data)
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get(self, order_id: int) -> Order | None:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        return result.scalars().first()

    async def get_by_user(self, user_id: int) -> list[Order]:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.user_id == user_id)
        )
        return list(result.scalars().all())


class OrderItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> OrderItem:
        item = OrderItem(**data)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
```

- [ ] **Step 5: Create app/orders/service.py**

```python
from fastapi import HTTPException
from app.orders.repository import OrderRepository, OrderItemRepository
from app.cart.repository import CartRepository
from app.products.repository import ProductRepository


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        order_item_repo: OrderItemRepository,
        cart_repo: CartRepository,
        product_repo: ProductRepository,
    ):
        self.order_repo = order_repo
        self.order_item_repo = order_item_repo
        self.cart_repo = cart_repo
        self.product_repo = product_repo

    async def create_from_cart(self, user_id: int):
        cart = await self.cart_repo.get_by_user(user_id)
        if not cart or not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total = 0.0
        items_data = []
        for item in cart.items:
            product = await self.product_repo.get(item.product_id)
            total += product.price * item.quantity
            items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": product.price,
            })

        order = await self.order_repo.create({"user_id": user_id, "total_price": total})
        for item_data in items_data:
            item_data["order_id"] = order.id
            await self.order_item_repo.create(item_data)

        await self.cart_repo.delete(cart.id)
        return await self.order_repo.get(order.id)

    async def get_user_orders(self, user_id: int):
        return await self.order_repo.get_by_user(user_id)
```

- [ ] **Step 6: Create app/orders/router.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.orders.repository import OrderRepository, OrderItemRepository
from app.orders.service import OrderService
from app.cart.repository import CartRepository
from app.products.repository import ProductRepository
from app.orders.schema import OrderOut
from app.users.model import User

router = APIRouter()


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(
        OrderRepository(db),
        OrderItemRepository(db),
        CartRepository(db),
        ProductRepository(db),
    )


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return await service.create_from_cart(current_user.id)


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return await service.get_user_orders(current_user.id)
```

- [ ] **Step 7: Commit**

```bash
git add backend/app/orders/
git commit -m "feat: add orders domain"
```

---

### Task 12: API Aggregator + main.py

**Files:**
- Create: `backend/app/api.py`
- Create: `backend/main.py`

- [ ] **Step 1: Create app/api.py**

```python
from fastapi import APIRouter
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.categories.router import router as categories_router
from app.products.router import router as products_router
from app.product_images.router import router as images_router
from app.cart.router import router as cart_router
from app.orders.router import router as orders_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(images_router, prefix="/product-images", tags=["product-images"])
api_router.include_router(cart_router, prefix="/cart", tags=["cart"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
```

- [ ] **Step 2: Create main.py**

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.roles.model import Role
from app.api import api_router


async def seed_roles():
    async with AsyncSessionLocal() as db:
        for name in ("admin", "customer"):
            result = await db.execute(select(Role).where(Role.name == name))
            if not result.scalars().first():
                db.add(Role(name=name))
        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("uploads/products", exist_ok=True)
    await seed_roles()
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(api_router, prefix="/api/v1")
```

- [ ] **Step 3: Verify all imports resolve**

```bash
cd backend
python -c "from main import app; print('OK')"
```

Expected output: `OK`

- [ ] **Step 4: Run all tests**

```bash
cd backend
pytest tests/ -v
```

Expected: all tests PASS (9 tests total)

- [ ] **Step 5: Commit**

```bash
git add backend/app/api.py backend/main.py
git commit -m "feat: add API aggregator and main entrypoint with lifespan seed"
```

---

### Task 13: Alembic Async Migration Setup

**Files:**
- Create: `backend/alembic.ini` (via alembic init)
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/` (directory, via alembic init)

- [ ] **Step 1: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

Expected: `alembic.ini`, `alembic/env.py`, `alembic/script.py.mako`, `alembic/versions/` created.

- [ ] **Step 2: Clear sqlalchemy.url in alembic.ini**

Open `backend/alembic.ini`. Find:
```
sqlalchemy.url = driver://user:pass@localhost/dbname
```
Replace with:
```
sqlalchemy.url =
```

- [ ] **Step 3: Replace alembic/env.py**

```python
import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from app.core.config import settings
from app.core.database import Base
from app.roles.model import Role
from app.users.model import User
from app.categories.model import Category
from app.product_images.model import ProductImage
from app.products.model import Product
from app.cart.model import Cart, CartItem
from app.orders.model import Order, OrderItem

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(settings.DATABASE_URL)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

- [ ] **Step 4: Generate initial migration**

```bash
cd backend
alembic revision --autogenerate -m "initial"
```

Expected: new file appears in `alembic/versions/` named `<hash>_initial.py` with `op.create_table(...)` calls for all 8 tables.

- [ ] **Step 5: Apply migration**

```bash
cd backend
alembic upgrade head
```

Expected: tables created in PostgreSQL `ecommerce_db` — no errors.

- [ ] **Step 6: Start server and verify**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/docs` — verify 7 tag groups appear: auth, users, categories, products, product-images, cart, orders.

- [ ] **Step 7: Commit**

```bash
git add backend/alembic.ini backend/alembic/
git commit -m "feat: add Alembic async migration setup with all models"
```

---

## Self-Review

**Spec coverage:**
- ✅ Users: `POST /users/` (register), `GET /users/me`
- ✅ Roles: seeded `admin` + `customer` at startup, idempotent, no endpoints
- ✅ Auth: `POST /auth/login` → JWT, `sub: user_id`, 1440min expiry
- ✅ Categories: `POST /categories/`, `GET /categories/`
- ✅ Products: `POST /products/`, `GET /products/`, `GET /products/{id}`, nested images via `selectinload`
- ✅ Product Images: upload multipart, list by product, delete with disk cleanup, UUID filenames
- ✅ Static files: `/uploads` mounted from `uploads/` directory
- ✅ Cart: `GET /cart/` (auto-create), `POST /cart/items`
- ✅ Orders: `POST /orders/` (cart → order, cascade delete cart), `GET /orders/`
- ✅ Alembic async migrations, all models imported in env.py
- ✅ `lifespan` context manager (no deprecated `@on_event`)
- ✅ DI factory functions per domain router
- ✅ `aiofiles` async file I/O for image upload
- ✅ `datetime.now(timezone.utc)` — no deprecated `datetime.utcnow()`

**Type consistency check:**
- `UserService.get_user(int)` — defined Task 5 Step 7, used in Task 6 Step 6 ✅
- `UserService.get_user_by_email(str)` — defined Task 5 Step 7, used in Task 6 Step 5 ✅
- `AuthService.authenticate(str, str)` — defined Task 6 Step 5, used in Task 6 Step 7 ✅
- `CartRepository.get_by_user(int)` — defined Task 10 Step 4, used in Task 11 Step 5 ✅
- `CartRepository.delete(int)` — defined Task 10 Step 4, used in Task 11 Step 5 ✅
- `ProductRepository.get(int)` — defined Task 9 Step 6, used in Task 11 Step 5 ✅
- `ProductImageService.upload(int, UploadFile)` — defined Task 8 Step 5, used in Task 8 Step 6 ✅
- `OrderRepository.get(int)` — defined Task 11 Step 4, used in Task 11 Step 5 ✅
