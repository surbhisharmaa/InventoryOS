from decimal import Decimal
from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.schemas.order import (
    OrderCreate, OrderResponse, OrderListResponse, OrderItemResponse,
)
from app.middleware.auth import CurrentUser, AdminUser

router = APIRouter(prefix="/orders", tags=["Orders"])


def _build_order_response(order: Order) -> OrderResponse:
    """Convert ORM Order → OrderResponse, populating nested fields."""
    items = [
        OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            product_sku=item.product.sku if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else None,
        customer_email=order.customer.email if order.customer else None,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


async def _load_order(order_id: uuid.UUID, db: AsyncSession) -> Order | None:
    """Load a single order with all relationships eagerly."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
    )
    return result.scalar_one_or_none()


@router.get("", response_model=OrderListResponse)
async def list_orders(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve all orders."""
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.customer),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    total_result = await db.execute(select(func.count()).select_from(Order))
    total = total_result.scalar_one()
    return OrderListResponse(
        items=[_build_order_response(o) for o in orders],
        total=total,
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve order details by ID."""
    order = await _load_order(order_id, db)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _build_order_response(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new order.
    - Validates customer exists.
    - Validates each product exists and has sufficient stock.
    - Automatically deducts stock.
    - Calculates total amount from product selling_price × quantity.
    """
    # Verify customer exists
    cust_result = await db.execute(select(Customer).where(Customer.id == payload.customer_id))
    customer = cust_result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Validate all products and stock availability (with row-level locks)
    resolved = []
    for item_data in payload.items:
        prod_result = await db.execute(
            select(Product)
            .where(Product.id == item_data.product_id, Product.is_deleted == False)
            .with_for_update()
        )
        product = prod_result.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found",
            )
        if product.quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity}, Requested: {item_data.quantity}"
                ),
            )
        resolved.append((product, item_data.quantity))

    # Create order
    order = Order(
        customer_id=payload.customer_id,
        notes=payload.notes,
        status=OrderStatus.CONFIRMED,
    )
    db.add(order)
    await db.flush()  # get order.id without committing

    # Create order items and deduct stock
    total_amount = Decimal("0.00")
    for product, qty in resolved:
        unit_price = product.selling_price
        subtotal = unit_price * qty
        total_amount += subtotal

        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        db.add(item)

        # Deduct stock
        product.quantity -= qty

    order.total_amount = total_amount
    await db.commit()

    # Reload with all relationships
    loaded = await _load_order(order.id, db)
    return _build_order_response(loaded)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(
    order_id: uuid.UUID,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Cancel/Delete an order (Admin only).
    Restores stock quantities for all order items.
    """
    order = await _load_order(order_id, db)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already cancelled")

    # Restore stock for each item
    for item in order.items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id).with_for_update()
        )
        product = prod_result.scalar_one_or_none()
        if product:
            product.quantity += item.quantity

    order.status = OrderStatus.CANCELLED
    await db.commit()
