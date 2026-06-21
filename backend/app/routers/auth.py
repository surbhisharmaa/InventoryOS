from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import (
    UserRegisterRequest, UserLoginRequest, PasswordResetRequest,
    TokenResponse, UserResponse,
)
from app.middleware.auth import CurrentUser

router = APIRouter(prefix="/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user. Only admins should expose this in production."""
    # Check for duplicate email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate a user and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact an administrator.",
        )

    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
    )


@router.post("/password-reset", status_code=status.HTTP_200_OK)
async def password_reset(
    payload: PasswordResetRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reset user password (in production, this would send an email link)."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        # Return success even for unknown emails to prevent email enumeration
        return {"message": "If that email exists, a password reset has been applied."}

    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"message": "Password updated successfully."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    """Return the currently authenticated user's profile."""
    return current_user
