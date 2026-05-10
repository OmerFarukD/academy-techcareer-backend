import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.config import settings
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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(api_router, prefix="/api/v1")
