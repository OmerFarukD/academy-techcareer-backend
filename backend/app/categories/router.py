from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.categories.repository import CategoryRepository
from app.categories.service import CategoryService
from app.categories.schema import CategoryCreate, CategoryOut

router = APIRouter()


def get_category_service(db: AsyncSession = Depends(get_db)) -> CategoryService:
    return CategoryService(CategoryRepository(db))


@router.post("/", response_model=CategoryOut, status_code=201)
async def create_category(data: CategoryCreate, service: CategoryService = Depends(get_category_service)):
    return await service.create(data)


@router.get("/", response_model=list[CategoryOut])
async def list_categories(service: CategoryService = Depends(get_category_service)):
    return await service.get_all()
