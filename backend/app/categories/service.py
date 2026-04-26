from app.categories.repository import CategoryRepository
from app.categories.schema import CategoryCreate


class CategoryService:
    def __init__(self, repo: CategoryRepository):
        self.repo = repo

    async def create(self, data: CategoryCreate):
        return await self.repo.create(data.model_dump())

    async def get_all(self):
        return await self.repo.get_all()
