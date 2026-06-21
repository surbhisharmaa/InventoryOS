import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
from app.models.stock_transaction import TransactionType
from app.models.purchase_order import OrderStatus


class StockAdjustRequest(BaseModel):
    product_id: uuid.UUID
    transaction_type: TransactionType
    quantity_changed: int
    notes: Optional[str] = None

    @field_validator("quantity_changed")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity_changed must be a positive integer")
        return v


class StockTransactionResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    transaction_type: TransactionType
    quantity_changed: int
    quantity_before: int
    quantity_after: int
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class StockTransactionListResponse(BaseModel):
    items: list[StockTransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PurchaseOrderResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    supplier_id: Optional[uuid.UUID]
    quantity_ordered: int
    status: OrderStatus
    triggered_by: Optional[uuid.UUID]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LowStockItem(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    category: str
    quantity: int
    reorder_point: int
    supplier_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}
