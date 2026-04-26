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
