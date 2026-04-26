from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.repository import ProductRepository
from app.products.service import ProductService
from app.products.schema import ProductCreate, ProductOut

router = APIRouter()


def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db))


@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(data: ProductCreate, service: ProductService = Depends(get_product_service)):
    return await service.create(data)


@router.get("/", response_model=list[ProductOut])
async def list_products(service: ProductService = Depends(get_product_service)):
    return await service.get_all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, service: ProductService = Depends(get_product_service)):
    product = await service.get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
