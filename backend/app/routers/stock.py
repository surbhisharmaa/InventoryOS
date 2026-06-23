from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product
from app.models.stock_transaction import StockTransaction, TransactionType
from app.models.purchase_order import PurchaseOrder, OrderStatus
from app.schemas.stock import (
    StockAdjustRequest, StockTransactionResponse,
    StockTransactionListResponse, PurchaseOrderResponse, LowStockItem,
)
from app.middleware.auth import CurrentUser
import math

router = APIRouter(prefix="/stock", tags=["Stock & Alerts"])


@router.post("/adjust", response_model=StockTransactionResponse, status_code=status.HTTP_201_CREATED)
async def adjust_stock(
    payload: StockAdjustRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    ACID-compliant stock adjustment with row-level locking.
    Automatically creates a reorder log if quantity falls below reorder_point.
    """
    # Acquire row-level lock to prevent race conditions
    result = await db.execute(
        select(Product)
        .where(Product.id == payload.product_id, Product.is_deleted == False)
        .with_for_update()
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    quantity_before = product.quantity

    if payload.transaction_type == TransactionType.IN:
        new_quantity = quantity_before + payload.quantity_changed
    elif payload.transaction_type == TransactionType.OUT:
        if quantity_before < payload.quantity_changed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock. Available: {quantity_before}, Requested: {payload.quantity_changed}",
            )
        new_quantity = quantity_before - payload.quantity_changed
    else:  # ADJUSTMENT — set absolute value
        new_quantity = payload.quantity_changed

    product.quantity = new_quantity

    # Create audit log entry
    tx = StockTransaction(
        product_id=product.id,
        user_id=current_user.id,
        transaction_type=payload.transaction_type,
        quantity_changed=payload.quantity_changed,
        quantity_before=quantity_before,
        quantity_after=new_quantity,
        notes=payload.notes,
    )
    db.add(tx)

    # Auto-trigger purchase order if now at or below reorder point
    if new_quantity <= product.reorder_point:
        reorder_qty = max(product.reorder_point * 2, 10)
        po = PurchaseOrder(
            product_id=product.id,
            supplier_id=product.supplier_id,
            quantity_ordered=reorder_qty,
            triggered_by=current_user.id,
            notes=f"Auto-generated: stock ({new_quantity}) at or below reorder point ({product.reorder_point})",
        )
        db.add(po)

    await db.commit()
    await db.refresh(tx)
    return tx


@router.get("/transactions", response_model=StockTransactionListResponse)
async def list_transactions(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    product_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List stock transaction history with optional product filtering."""
    base_q = select(StockTransaction).options(selectinload(StockTransaction.product))

    if product_id:
        base_q = base_q.where(StockTransaction.product_id == product_id)

    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        base_q.order_by(StockTransaction.created_at.desc()).offset(offset).limit(page_size)
    )
    items = result.scalars().all()

    # Build response with product details
    item_responses = [
        StockTransactionResponse(
            id=tx.id,
            product_id=tx.product_id,
            product_name=tx.product.name if tx.product else None,
            product_sku=tx.product.sku if tx.product else None,
            user_id=tx.user_id,
            transaction_type=tx.transaction_type,
            quantity_changed=tx.quantity_changed,
            quantity_before=tx.quantity_before,
            quantity_after=tx.quantity_after,
            notes=tx.notes,
            created_at=tx.created_at,
        )
        for tx in items
    ]

    return StockTransactionListResponse(
        items=item_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/low-stock", response_model=list[LowStockItem])
async def get_low_stock(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Return all products where quantity <= reorder_point."""
    result = await db.execute(
        select(Product)
        .where(Product.is_deleted == False, Product.quantity <= Product.reorder_point)
        .order_by(Product.quantity.asc())
    )
    return result.scalars().all()


@router.post("/check-alerts", status_code=status.HTTP_200_OK)
async def trigger_low_stock_check(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Manually trigger a low-stock scan and generate purchase orders
    for any products without a pending reorder.
    """
    result = await db.execute(
        select(Product)
        .where(Product.is_deleted == False, Product.quantity <= Product.reorder_point)
    )
    low_stock_products = result.scalars().all()

    orders_created = 0
    for product in low_stock_products:
        # Check if a pending PO already exists for this product
        existing_po = await db.execute(
            select(PurchaseOrder).where(
                PurchaseOrder.product_id == product.id,
                PurchaseOrder.status == OrderStatus.PENDING,
            ).limit(1)
        )
        if existing_po.scalars().first():
            continue

        reorder_qty = max(product.reorder_point * 2, 10)
        po = PurchaseOrder(
            product_id=product.id,
            supplier_id=product.supplier_id,
            quantity_ordered=reorder_qty,
            triggered_by=current_user.id,
            notes=f"Manual check: stock ({product.quantity}) at or below reorder point ({product.reorder_point})",
        )
        db.add(po)
        orders_created += 1

    await db.commit()
    return {"message": f"Alert check complete. {orders_created} purchase order(s) created."}


@router.get("/purchase-orders", response_model=list[PurchaseOrderResponse])
async def list_purchase_orders(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """List all auto-generated purchase orders."""
    q = select(PurchaseOrder)
    if status_filter:
        q = q.where(PurchaseOrder.status == status_filter)
    result = await db.execute(q.order_by(PurchaseOrder.created_at.desc()))
    return result.scalars().all()
