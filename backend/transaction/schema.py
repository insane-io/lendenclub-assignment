from pydantic import BaseModel, PositiveFloat
from decimal import Decimal
from typing import Any, Optional


class TransferRequest(BaseModel):
    receiver_email: str
    amount: float
    # Payment PIN supplied by the sender for verification
    pin: str
    # Optional note describing the payment (user-supplied)
    note: Optional[str] = None


class TransferResult(BaseModel):
    sender_id: int
    receiver_id: int
    amount: float
    sender_balance: float
    receiver_balance: float
