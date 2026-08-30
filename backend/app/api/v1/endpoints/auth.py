
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token, UserCreate, UserLogin, UserOut
from app.services import auth_service
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

def get_current_user(
    authorization: str | None = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Use 'Bearer <token>'"
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register a new user account")
def signup(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user, token = auth_service.signup_user(db, data)
        return Token(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(user)
        )
    except ValueError as ex:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ex))

@router.post("/login", response_model=Token, summary="Authenticate user and return JWT access token")
def login(data: UserLogin, db: Session = Depends(get_db)):
    try:
        user, token = auth_service.login_user(db, data)
        return Token(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(user)
        )
    except ValueError as ex:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ex))

@router.get("/me", response_model=UserOut, summary="Get currently authenticated user details")
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
