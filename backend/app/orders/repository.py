from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.orders.model import Order, OrderItem


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Order:
        order = Order(**data)
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def get(self, order_id: int) -> Order | None:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        return result.scalars().first()

    async def get_by_user(self, user_id: int) -> list[Order]:
        result = await self.db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.user_id == user_id)
        )
        return list(result.scalars().all())


class OrderItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> OrderItem:
        item = OrderItem(**data)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
