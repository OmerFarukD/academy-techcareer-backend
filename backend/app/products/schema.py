from pydantic import BaseModel
from app.product_images.schema import ProductImageOut


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    category_id: int


class ProductOut(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    category_id: int | None
    images: list[ProductImageOut] = []

    model_config = {"from_attributes": True}
