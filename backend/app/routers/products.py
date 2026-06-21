from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    SupplierCreate, SupplierUpdate, SupplierResponse,
)
from app.middleware.auth import CurrentUser, AdminUser
import math

router = APIRouter(prefix="/products", tags=["Products"])
suppliers_router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("", response_model=ProductListResponse)
async def list_products(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    category: Optional[str] = Query(None, description="Filter by category"),
    low_stock_only: bool = Query(False, description="Return only low-stock items"),
):
    """List all products with server-side pagination, search, and filtering."""
    base_q = select(Product).where(Product.is_deleted == False).options(
        selectinload(Product.supplier)
    )

    if search:
        term = f"%{search.lower()}%"
        base_q = base_q.where(
            or_(
                func.lower(Product.name).like(term),
                func.lower(Product.sku).like(term),
            )
        )

    if category:
        base_q = base_q.where(Product.category == category)

    if low_stock_only:
        base_q = base_q.where(Product.quantity <= Product.reorder_point)

    # Count total for pagination
    count_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # Fetch page
    offset = (page - 1) * page_size
    result = await db.execute(
        base_q.order_by(Product.created_at.desc()).offset(offset).limit(page_size)
    )
    items = result.scalars().all()

    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.is_deleted == False)
        .options(selectinload(Product.supplier))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new product (Admin only)."""
    # Check SKU uniqueness
    existing = await db.execute(
        select(Product).where(Product.sku == payload.sku, Product.is_deleted == False)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A product with SKU '{payload.sku}' already exists",
        )

    product = Product(**payload.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)

    # Reload with supplier relationship
    result = await db.execute(
        select(Product).where(Product.id == product.id).options(selectinload(Product.supplier))
    )
    return result.scalar_one()


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update product metadata (Admin only). Use /stock/adjust to change quantities."""
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)

    result = await db.execute(
        select(Product).where(Product.id == product.id).options(selectinload(Product.supplier))
    )
    return result.scalar_one()


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft-delete a product (Admin only). Historical transactions are preserved."""
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_deleted == False)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.is_deleted = True
    await db.commit()


# ── Suppliers ─────────────────────────────────────────────────────────────────

@suppliers_router.get("", response_model=list[SupplierResponse])
async def list_suppliers(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    active_only: bool = Query(True),
):
    q = select(Supplier)
    if active_only:
        q = q.where(Supplier.is_active == True)
    result = await db.execute(q.order_by(Supplier.name))
    return result.scalars().all()


@suppliers_router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@suppliers_router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    payload: SupplierCreate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@suppliers_router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)

    await db.commit()
    await db.refresh(supplier)
    return supplier


@suppliers_router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: str,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    supplier.is_active = False
    await db.commit()
