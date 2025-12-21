from pydantic import BaseModel, EmailStr
from typing import Optional


class Signup(BaseModel):
    name: str
    email: EmailStr
    password: str
    # PIN: optional 4-6 digits used for payments (validated server-side)
    pin: Optional[str] = None


class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    balance: float

    class Config:
        orm_mode = True


class SignupResponse(BaseModel):
    user: UserOut
    access_token: str
    token_type: str = "bearer"


class SearchOut(BaseModel):
    """Response model for user search results."""
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True


class SetPin(BaseModel):
    pin: str
