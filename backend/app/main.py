from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.redis_client import get_redis, close_redis
from app.routers import auth_router, products_router, suppliers_router, stock_router, analytics_router, customers_router, orders_router

logger = logging.getLogger(__name__)
settings = get_settings()


async def _seed_admin():
    """Ensure a default admin user exists with a proper bcrypt hash."""
    try:
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from app.core.security import get_password_hash
        from app.models.user import User, UserRole

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == "admin@inventory.com"))
            user = result.scalar_one_or_none()
            if user:
                user.hashed_password = get_password_hash("Admin@123456")
                await session.commit()
                logger.info("Admin user password hash refreshed.")
            else:
                user = User(
                    email="admin@inventory.com",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("Admin@123456"),
                    role=UserRole.admin,
                )
                session.add(user)
                await session.commit()
                logger.info("Default admin user created.")
    except Exception as exc:
        logger.warning(f"Admin seed skipped (DB may not be ready): {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown lifecycle events."""
    # Startup — warm up Redis connection and seed DB
    await get_redis()
    await _seed_admin()
    yield
    # Shutdown — close Redis connection
    await close_redis()


app = FastAPI(
    title="Inventory Management System API",
    description="Production-ready RESTful API for managing inventory, products, and stock.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
PREFIX = settings.API_V1_PREFIX

app.include_router(auth_router,      prefix=PREFIX)
app.include_router(products_router,  prefix=PREFIX)
app.include_router(suppliers_router, prefix=PREFIX)
app.include_router(stock_router,     prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(customers_router, prefix=PREFIX)
app.include_router(orders_router,    prefix=PREFIX)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Inventory Management System API", "docs": "/docs"}
