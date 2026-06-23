import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, field_validator
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity must be greater than 0")
        return v


class OrderCreate(BaseModel):
    customer_id: uuid.UUID
    items: list[OrderItemCreate]
    notes: str | None = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("An order must have at least one item")
        return v


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str | None = None
    product_sku: str | None = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_product(cls, item) -> "OrderItemResponse":
        return cls(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            product_sku=item.product.sku if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )


class OrderResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str | None = None
    customer_email: str | None = None
    status: OrderStatus
    total_amount: Decimal
    notes: str | None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
