from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str
    PORT: int
    DB_USER: str
    PASSWORD: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.DB_NAME}"

    model_config = {"env_file": Path(__file__).parent.parent.parent / ".env"}


settings = Settings()
