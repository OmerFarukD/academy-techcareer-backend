from pydantic import BaseModel


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int


class CartItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    id: int
    user_id: int
    items: list[CartItemOut] = []

    model_config = {"from_attributes": True}
