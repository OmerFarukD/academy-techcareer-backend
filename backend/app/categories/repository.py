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
