from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.cart.repository import CartRepository, CartItemRepository
from app.cart.service import CartService
from app.cart.schema import CartItemCreate, CartItemOut, CartOut
from app.users.model import User

router = APIRouter()


def get_cart_service(db: AsyncSession = Depends(get_db)) -> CartService:
    return CartService(CartRepository(db), CartItemRepository(db))


@router.get("/", response_model=CartOut)
async def get_cart(
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    return await service.get_or_create(current_user.id)


@router.post("/items", response_model=CartItemOut, status_code=201)
async def add_item(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    service: CartService = Depends(get_cart_service),
):
    return await service.add_item(current_user.id, item)
