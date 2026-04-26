import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base
from app.categories.model import Category
from app.product_images.model import ProductImage
from app.products.model import Product
from app.cart.model import Cart, CartItem
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
    try:
        async with factory() as s:
            yield s
    finally:
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
