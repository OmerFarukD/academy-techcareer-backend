import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.roles.model import Role
from app.users.model import User
from app.cart.model import Cart, CartItem
from app.orders.model import Order, OrderItem
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
    try:
        async with factory() as s:
            yield s
    finally:
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
