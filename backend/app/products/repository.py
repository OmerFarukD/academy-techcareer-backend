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
        return await self.get(obj.id)

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
