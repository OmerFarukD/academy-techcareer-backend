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
