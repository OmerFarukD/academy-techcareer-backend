import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.roles.model import Role
from app.api import api_router


async def seed_roles():
    async with AsyncSessionLocal() as db:
        for name in ("admin", "customer"):
            result = await db.execute(select(Role).where(Role.name == name))
            if not result.scalars().first():
                db.add(Role(name=name))
        await db.commit()


os.makedirs("uploads/products", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_roles()
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(api_router, prefix="/api/v1")
