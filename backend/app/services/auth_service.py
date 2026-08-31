import uuid

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreate, UserLogin


def signup_user(db: Session, data: UserCreate) -> tuple[User, str]:
    user_repo = UserRepository(db)
    existing = user_repo.get_by_email(data.email)
    if existing:
        raise ValueError(f"User with email '{data.email}' already exists")

    hashed_pw = hash_password(data.password)
    new_user = User(
        id=str(uuid.uuid4()),
        email=data.email.strip().lower(),
        hashed_password=hashed_pw,
        full_name=data.full_name.strip(),
        role=data.role or "HR_MANAGER",
        is_active=True,
    )
    user = user_repo.create(new_user)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return user, token


def login_user(db: Session, data: UserLogin) -> tuple[User, str]:
    user_repo = UserRepository(db)
    user = user_repo.get_by_email(data.email)
    if not user:
        raise ValueError("Invalid email or password")

    if not verify_password(data.password, user.hashed_password):
        raise ValueError("Invalid email or password")

    if not user.is_active:
        raise ValueError("User account is inactive. Please contact administrator.")

    user_repo.update_last_login(user.id)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return user, token
