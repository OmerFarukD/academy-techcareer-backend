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

    async def update(self, product_id: int, data: dict) -> Product | None:
        product = await self.get(product_id)
        if not product:
            return None
        for key, value in data.items():
            setattr(product, key, value)
        await self.db.commit()
        return await self.get(product_id)

    async def delete(self, product_id: int) -> bool:
        product = await self.get(product_id)
        if not product:
            return False
        await self.db.delete(product)
        await self.db.commit()
        return True
