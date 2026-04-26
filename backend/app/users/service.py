from app.users.repository import UserRepository
from app.users.schema import UserCreate
from app.core.security import get_password_hash


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    async def create_user(self, user_in: UserCreate):
        data = user_in.model_dump()
        data["hashed_password"] = get_password_hash(data.pop("password"))
        return await self.repo.create(data)

    async def get_user(self, user_id: int):
        return await self.repo.get(user_id)

    async def get_user_by_email(self, email: str):
        return await self.repo.get_by_email(email)
