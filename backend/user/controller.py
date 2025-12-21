from sqlalchemy.orm import Session
from decimal import Decimal

from .models import User
from .auth import hash_password, verify_password, create_access_token
INITIAL_BALANCE = Decimal("10000.00")


def create_user(db: Session, name: str, email: str, password: str, pin: str | None = None) -> User:
    """Create a new user with an initial test balance.

    If `pin` is provided it will be hashed and stored in `hashed_pin`.
    """
    hashed = hash_password(password)
    hashed_pin = None
    if pin is not None:
        # reuse same hashing for PINs (PBKDF2 + salt)
        hashed_pin = hash_password(pin)

    user = User(name=name, email=email, hashed_password=hashed, hashed_pin=hashed_pin, balance=INITIAL_BALANCE)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_token_for_user(user: User, expires_seconds: int = 3600) -> str:
    return create_access_token(user.id, expires_seconds=expires_seconds)
