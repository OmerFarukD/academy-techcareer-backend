# E-Commerce Backend — Design Spec
**Date:** 2026-04-26  
**Status:** Approved

## Overview

Production-level FastAPI e-commerce backend. Covers user management, role-based auth, products with multi-image support, categories, cart, and orders.

## Tech Stack

| Component | Choice |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL (HOST: localhost, PORT: 5433) |
| ORM | SQLAlchemy (async) |
| Migration | Alembic (async) |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Validation | Pydantic v2 |
| File I/O | aiofiles |
| Server | Uvicorn |

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── api.py                  # aggregate router
│   ├── core/
│   │   ├── config.py           # pydantic-settings, reads .env
│   │   ├── database.py         # async engine, Base, get_db
│   │   ├── security.py         # JWT, bcrypt helpers
│   │   └── dependencies.py     # get_current_user
│   ├── users/
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── repository.py
│   │   ├── service.py
│   │   └── router.py
│   ├── roles/
│   │   └── model.py            # model + seed data only (no endpoints)
│   ├── auth/
│   │   ├── schema.py
│   │   ├── service.py
│   │   └── router.py
│   ├── categories/
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── repository.py
│   │   ├── service.py
│   │   └── router.py
│   ├── products/
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── repository.py
│   │   ├── service.py
│   │   └── router.py
│   ├── product_images/
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── repository.py
│   │   ├── service.py          # aiofiles upload, UUID filenames, disk cleanup on delete
│   │   └── router.py
│   ├── cart/
│   │   ├── model.py
│   │   ├── schema.py
│   │   ├── repository.py
│   │   ├── service.py
│   │   └── router.py
│   └── orders/
│       ├── model.py
│       ├── schema.py
│       ├── repository.py
│       ├── service.py
│       └── router.py
├── alembic/
│   ├── env.py                  # async migration setup
│   └── versions/
├── alembic.ini
├── .env
├── main.py
└── requirements.txt
```

## Architecture

### Layered Pattern (per domain)
```
Router → Service → Repository → Model
```
- **Router**: HTTP endpoints + DI factory functions (Depends)
- **Service**: Business logic, orchestrates repositories
- **Repository**: Async SQLAlchemy queries only
- **Model**: SQLAlchemy ORM class

### Dependency Injection
Service factory functions live inside each domain's `router.py`:
```python
def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db))
```
`core/dependencies.py` is reserved for auth (`get_current_user`).

## Domain Specifications

### Users
- Fields: `id`, `email` (unique), `hashed_password`, `is_active`, `role_id`
- Endpoints: `POST /users/` (register), `GET /users/me` (authenticated)

### Roles
- Fields: `id`, `name` (unique)
- No endpoints — seeded at startup: `admin`, `customer`
- Seed is idempotent (checks before insert)

### Auth
- `POST /auth/login` → OAuth2PasswordRequestForm → JWT token
- Token contains `sub: user_id`
- Expiry: 1440 minutes (configurable via `.env`)

### Categories
- Fields: `id`, `name` (unique)
- Endpoints: `POST /categories/`, `GET /categories/`

### Products
- Fields: `id`, `name`, `description`, `price`, `category_id`
- Endpoints: `POST /products/`, `GET /products/`, `GET /products/{id}`
- Response includes nested `images: list[ProductImageOut]` via `selectinload`

### Product Images
- Fields: `id`, `product_id` (FK), `image_url`, `created_at`
- Storage: `uploads/products/{uuid}.{ext}` (local filesystem)
- Static serving: `/uploads` mounted via FastAPI `StaticFiles`
- Endpoints:
  - `POST /product-images/{product_id}` — multipart/form-data upload
  - `GET /product-images/{product_id}` — list images for product
  - `DELETE /product-images/{image_id}` — delete record + disk file

### Cart
- `Cart`: `id`, `user_id` (unique FK)
- `CartItem`: `id`, `cart_id`, `product_id`, `quantity`
- One cart per user, auto-created on first access
- Endpoints: `GET /cart/`, `POST /cart/items`

### Orders
- `Order`: `id`, `user_id`, `total_price`, `status` (default: `pending`), `created_at`
- `OrderItem`: `id`, `order_id`, `product_id`, `quantity`, `price`
- `POST /orders/` — converts cart to order (calculates total, deletes cart + all cart items via cascade)
- `GET /orders/` — user's order history

## Database Config (.env)

```
HOST=localhost
PORT=5433
USER=postgres
PASSWORD=123456
DB_NAME=ecommerce_db
SECRET_KEY=<secure-value>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

## Alembic Setup

- `alembic.ini`: `sqlalchemy.url` left empty (overridden in `env.py`)
- `alembic/env.py`: imports all models and uses async engine from `core/database.py`
- All domain models must be imported in `env.py` for autogenerate to work
- First migration: `alembic revision --autogenerate -m "initial"`
- Apply: `alembic upgrade head`

## Startup Behavior

`main.py` uses FastAPI `lifespan` context manager (not deprecated `@on_event`):
- Creates `uploads/products/` directory
- Seeds `admin` and `customer` roles (idempotent)
- Mounts `/uploads` static files

## File Naming & UUID

Image filenames: `{uuid4()}.{original_extension}` — ensures uniqueness, prevents path traversal.
