from datetime import datetime
from pydantic import BaseModel


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []

    model_config = {"from_attributes": True}
