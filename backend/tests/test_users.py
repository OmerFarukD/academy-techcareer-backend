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
