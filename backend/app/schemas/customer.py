import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class CustomerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("full_name cannot be empty")
        return v


class CustomerResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
