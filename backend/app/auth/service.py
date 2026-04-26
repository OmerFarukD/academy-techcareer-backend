from app.users.service import UserService
from app.core.security import verify_password


class AuthService:
    def __init__(self, user_service: UserService):
        self.user_service = user_service

    async def authenticate(self, email: str, password: str):
        user = await self.user_service.get_user_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user
