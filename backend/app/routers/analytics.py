from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from decimal import Decimal
from app.core.database import get_db
from app.models.product import Product
from app.models.stock_transaction import StockTransaction, TransactionType
from app.models.customer import Customer
from app.models.order import Order
from app.middleware.auth import CurrentUser, AdminUser

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", summary="Dashboard metrics summary")
async def get_dashboard_metrics(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Returns high-level inventory KPIs for the dashboard.
    Revenue analytics are restricted to Admin users.
    """
    # Total products
    total_result = await db.execute(
        select(func.count()).where(Product.is_deleted == False)
    )
    total_products = total_result.scalar_one()

    # Low stock count
    low_result = await db.execute(
        select(func.count()).where(
            Product.is_deleted == False,
            Product.quantity <= Product.reorder_point,
        )
    )
    low_stock_count = low_result.scalar_one()

    # Out of stock count
    out_result = await db.execute(
        select(func.count()).where(
            Product.is_deleted == False,
            Product.quantity == 0,
        )
    )
    out_of_stock_count = out_result.scalar_one()

    # Total inventory value (cost_price * quantity)
    value_result = await db.execute(
        select(func.sum(Product.cost_price * Product.quantity)).where(
            Product.is_deleted == False
        )
    )
    total_inventory_value = float(value_result.scalar_one() or 0)

    # Total customers
    cust_result = await db.execute(select(func.count()).select_from(Customer))
    total_customers = cust_result.scalar_one()

    # Total orders
    orders_result = await db.execute(select(func.count()).select_from(Order))
    total_orders = orders_result.scalar_one()

    base_data = {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "total_inventory_value": round(total_inventory_value, 2),
        "total_customers": total_customers,
        "total_orders": total_orders,
        "monthly_revenue": None,
    }

    # Monthly revenue — Admin only
    if current_user.role.value == "admin":
        revenue_result = await db.execute(
            select(
                func.sum(
                    StockTransaction.quantity_changed
                    * text("(SELECT selling_price FROM products WHERE id = stock_transactions.product_id)")
                )
            ).where(
                StockTransaction.transaction_type == TransactionType.OUT,
                func.date_trunc("month", StockTransaction.created_at) == func.date_trunc("month", func.now()),
            )
        )
        monthly_revenue = float(revenue_result.scalar_one() or 0)
        base_data["monthly_revenue"] = round(monthly_revenue, 2)

    return base_data


@router.get("/stock-by-category", summary="Stock levels grouped by category")
async def get_stock_by_category(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Returns category-level aggregates for the dashboard bar chart."""
    result = await db.execute(
        select(
            Product.category,
            func.count(Product.id).label("product_count"),
            func.sum(Product.quantity).label("total_quantity"),
            func.sum(Product.cost_price * Product.quantity).label("total_value"),
        )
        .where(Product.is_deleted == False)
        .group_by(Product.category)
        .order_by(func.sum(Product.quantity).desc())
    )
    rows = result.all()

    return [
        {
            "category": row.category,
            "product_count": row.product_count,
            "total_quantity": int(row.total_quantity or 0),
            "total_value": round(float(row.total_value or 0), 2),
        }
        for row in rows
    ]


@router.get("/transaction-history", summary="Recent stock transaction activity")
async def get_transaction_history(
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Returns last 30 days of stock movement, grouped by day (Admin only)."""
    result = await db.execute(
        text("""
            SELECT
                DATE(created_at) as date,
                SUM(CASE WHEN transaction_type = 'IN' THEN quantity_changed ELSE 0 END) as stock_in,
                SUM(CASE WHEN transaction_type = 'OUT' THEN quantity_changed ELSE 0 END) as stock_out,
                SUM(CASE WHEN transaction_type = 'ADJUSTMENT' THEN 1 ELSE 0 END) as adjustments
            FROM stock_transactions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        """)
    )
    rows = result.fetchall()
    return [
        {
            "date": str(row.date),
            "stock_in": int(row.stock_in),
            "stock_out": int(row.stock_out),
            "adjustments": int(row.adjustments),
        }
        for row in rows
    ]
