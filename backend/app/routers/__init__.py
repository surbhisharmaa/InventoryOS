# routers package
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router, suppliers_router
from app.routers.stock import router as stock_router
from app.routers.analytics import router as analytics_router

__all__ = ["auth_router", "products_router", "suppliers_router", "stock_router", "analytics_router"]
