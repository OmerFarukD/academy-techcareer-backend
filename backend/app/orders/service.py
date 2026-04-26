from fastapi import HTTPException
from app.orders.repository import OrderRepository, OrderItemRepository
from app.cart.repository import CartRepository
from app.products.repository import ProductRepository


class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        order_item_repo: OrderItemRepository,
        cart_repo: CartRepository,
        product_repo: ProductRepository,
    ):
        self.order_repo = order_repo
        self.order_item_repo = order_item_repo
        self.cart_repo = cart_repo
        self.product_repo = product_repo

    async def create_from_cart(self, user_id: int):
        cart = await self.cart_repo.get_by_user(user_id)
        if not cart or not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total = 0.0
        items_data = []
        for item in cart.items:
            product = await self.product_repo.get(item.product_id)
            total += product.price * item.quantity
            items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": product.price,
            })

        order = await self.order_repo.create({"user_id": user_id, "total_price": total})
        for item_data in items_data:
            item_data["order_id"] = order.id
            await self.order_item_repo.create(item_data)

        await self.cart_repo.delete(cart.id)
        return await self.order_repo.get(order.id)

    async def get_user_orders(self, user_id: int):
        return await self.order_repo.get_by_user(user_id)
