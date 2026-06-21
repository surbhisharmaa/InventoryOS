"""
Database seeding utility.
Run once after startup to ensure default admin user exists.
The SQL init.sql creates the admin with a placeholder hash.
This script replaces it with a properly bcrypt-hashed password.
"""
import asyncio
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole


ADMIN_EMAIL = "admin@inventory.com"
ADMIN_PASSWORD = "Admin@123456"
ADMIN_NAME = "System Administrator"


async def seed_admin():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        user = result.scalar_one_or_none()

        if user:
            # Update the hash in case it was seeded with a placeholder
            user.hashed_password = get_password_hash(ADMIN_PASSWORD)
            await session.commit()
            print(f"[seed] Admin user '{ADMIN_EMAIL}' password hash refreshed.")
        else:
            user = User(
                email=ADMIN_EMAIL,
                full_name=ADMIN_NAME,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role=UserRole.admin,
            )
            session.add(user)
            await session.commit()
            print(f"[seed] Admin user '{ADMIN_EMAIL}' created.")


if __name__ == "__main__":
    asyncio.run(seed_admin())
