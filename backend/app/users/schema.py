from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_id: int | None = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    role_id: int | None = None

    model_config = {"from_attributes": True}
