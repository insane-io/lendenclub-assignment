from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
import re

try:
    from ..database import get_db
    from .schema import Signup, Login, Token, UserOut, SignupResponse, SearchOut, SetPin
    from .controller import create_user, authenticate_user, create_token_for_user
    from .models import User
    from .auth import decode_access_token, hash_password
except Exception:
    from database import get_db
    from user.schema import Signup, Login, Token, UserOut, SignupResponse, SearchOut, SetPin
    from user.controller import create_user, authenticate_user, create_token_for_user
    from user.models import User
    from user.auth import decode_access_token, hash_password


router = APIRouter()

# bearer dependency instance
bearer_scheme = HTTPBearer()


@router.post("/signup", response_model=SignupResponse)
def signup(payload: Signup, db: Session = Depends(get_db)):
    # check for existing email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # create user with optional PIN
    pin = getattr(payload, "pin", None)
    if pin is not None:
        # normalize empty strings to None
        if isinstance(pin, str) and pin.strip() == "":
            pin = None
    # validate pin format if provided
    if pin is not None and not re.fullmatch(r"\d{4,6}", pin):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN must be 4-6 digits")
    user = create_user(db, payload.name, payload.email, payload.password, pin)
    token = create_token_for_user(user)
    return {"user": user, "access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(payload: Login, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token_for_user(user)
    return {"access_token": token, "token_type": "bearer"}

def _get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme), db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(_get_current_user_from_token)):
    return current_user


@router.post("/set-pin")
def set_pin(payload: SetPin, current_user: User = Depends(_get_current_user_from_token), db: Session = Depends(get_db)):
    """Set or update the authenticated user's payment PIN."""
    # hash and store the PIN
    if not getattr(payload, "pin", None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN required")
    pin = payload.pin
    if not re.fullmatch(r"\d{4,6}", pin):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN must be 4-6 digits")
    hashed = hash_password(pin)
    current_user.hashed_pin = hashed
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"success": True}


@router.get("/search", response_model=List[SearchOut])
def search(
    q: str = "",
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
):
    """Search for users by name or email (partial, case-insensitive).

    Example: GET /auth/search?q=alice
    Returns a list of matching users (max 10).
    """
    if not q or not q.strip():
        return []

    # Use case-insensitive partial match on name or email and limit results
    pattern = f"%{q}%"

    # If a bearer token was provided, try to decode it and exclude that user from results
    current_user_id: Optional[int] = None
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            current_user_id = int(payload.get("sub")) if payload.get("sub") is not None else None
        except Exception:
            # ignore invalid/expired tokens for search; treat as unauthenticated
            current_user_id = None

    query_stmt = db.query(User).filter((User.email.ilike(pattern)) | (User.name.ilike(pattern)))
    if current_user_id is not None:
        query_stmt = query_stmt.filter(User.id != current_user_id)

    users = query_stmt.limit(10).all()
    return users
