import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator


class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Supplier name cannot be empty")
        return v.strip()


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Product Schemas ───────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category: str
    quantity: int = 0
    reorder_point: int = 10
    cost_price: Decimal
    selling_price: Decimal
    supplier_id: Optional[uuid.UUID] = None


class ProductCreate(ProductBase):
    @field_validator("sku")
    @classmethod
    def sku_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()

    @field_validator("quantity")
    @classmethod
    def qty_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v

    @field_validator("cost_price", "selling_price")
    @classmethod
    def price_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("reorder_point")
    @classmethod
    def reorder_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Reorder point cannot be negative")
        return v


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    reorder_point: Optional[int] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    supplier_id: Optional[uuid.UUID] = None

    @field_validator("cost_price", "selling_price")
    @classmethod
    def price_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Price cannot be negative")
        return v

    @field_validator("reorder_point")
    @classmethod
    def reorder_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Reorder point cannot be negative")
        return v


class ProductResponse(ProductBase):
    id: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
