from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.users.repository import UserRepository
from app.users.service import UserService
from app.users.schema import UserCreate, UserOut
from app.users.model import User

router = APIRouter()


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.post("/", response_model=UserOut, status_code=201)
async def register(user_in: UserCreate, service: UserService = Depends(get_user_service)):
    return await service.create_user(user_in)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
