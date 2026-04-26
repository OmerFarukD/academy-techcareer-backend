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
