from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.orders.repository import OrderRepository, OrderItemRepository
from app.orders.service import OrderService
from app.cart.repository import CartRepository
from app.products.repository import ProductRepository
from app.orders.schema import OrderOut
from app.users.model import User

router = APIRouter()


def get_order_service(db: AsyncSession = Depends(get_db)) -> OrderService:
    return OrderService(
        OrderRepository(db),
        OrderItemRepository(db),
        CartRepository(db),
        ProductRepository(db),
    )


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return await service.create_from_cart(current_user.id)


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    current_user: User = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return await service.get_user_orders(current_user.id)
