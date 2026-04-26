from app.cart.repository import CartRepository, CartItemRepository
from app.cart.schema import CartItemCreate


class CartService:
    def __init__(self, cart_repo: CartRepository, item_repo: CartItemRepository):
        self.cart_repo = cart_repo
        self.item_repo = item_repo

    async def get_or_create(self, user_id: int):
        cart = await self.cart_repo.get_by_user(user_id)
        if not cart:
            cart = await self.cart_repo.create(user_id)
        return cart

    async def add_item(self, user_id: int, item: CartItemCreate):
        cart = await self.get_or_create(user_id)
        return await self.item_repo.create({
            "cart_id": cart.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
        })
