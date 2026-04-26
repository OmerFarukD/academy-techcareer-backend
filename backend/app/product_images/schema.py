from datetime import datetime
from pydantic import BaseModel


class ProductImageOut(BaseModel):
    id: int
    product_id: int
    image_url: str
    created_at: datetime

    model_config = {"from_attributes": True}
