from fastapi import APIRouter
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.categories.router import router as categories_router
from app.products.router import router as products_router
from app.product_images.router import router as images_router
from app.cart.router import router as cart_router
from app.orders.router import router as orders_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(products_router, prefix="/products", tags=["products"])
api_router.include_router(images_router, prefix="/product-images", tags=["product-images"])
api_router.include_router(cart_router, prefix="/cart", tags=["cart"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
