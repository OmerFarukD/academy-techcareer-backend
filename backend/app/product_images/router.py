from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.product_images.repository import ProductImageRepository
from app.product_images.service import ProductImageService
from app.product_images.schema import ProductImageOut

router = APIRouter()


def get_image_service(db: AsyncSession = Depends(get_db)) -> ProductImageService:
    return ProductImageService(ProductImageRepository(db))


@router.post("/{product_id}", response_model=ProductImageOut, status_code=201)
async def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    service: ProductImageService = Depends(get_image_service),
):
    return await service.upload(product_id, file)


@router.get("/{product_id}", response_model=list[ProductImageOut])
async def list_images(product_id: int, service: ProductImageService = Depends(get_image_service)):
    return await service.get_by_product(product_id)


@router.delete("/{image_id}")
async def delete_image(image_id: int, service: ProductImageService = Depends(get_image_service)):
    return {"deleted": await service.delete(image_id)}
