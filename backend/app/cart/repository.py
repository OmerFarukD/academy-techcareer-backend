from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.cart.model import Cart, CartItem


class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: int) -> Cart | None:
        result = await self.db.execute(
            select(Cart).options(selectinload(Cart.items)).where(Cart.user_id == user_id)
        )
        return result.scalars().first()

    async def create(self, user_id: int) -> Cart:
        cart = Cart(user_id=user_id)
        self.db.add(cart)
        await self.db.commit()
        await self.db.refresh(cart)
        return cart

    async def delete(self, cart_id: int) -> None:
        result = await self.db.execute(select(Cart).where(Cart.id == cart_id))
        cart = result.scalars().first()
        if cart:
            await self.db.delete(cart)
            await self.db.commit()


class CartItemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> CartItem:
        item = CartItem(**data)
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
