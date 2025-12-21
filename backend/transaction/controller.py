from decimal import Decimal
from typing import Tuple

from sqlalchemy.orm import Session

try:
    from .models import AuditLog
    from ..user.models import User
except Exception:
    from transaction.models import AuditLog
    from user.models import User


def transfer_funds(db: Session, sender: User, receiver_email: str, amount: Decimal, note: str | None = None) -> Tuple[User, User, AuditLog]:
    """Transfer amount from sender to receiver atomically.

    Raises ValueError for validation errors.
    Returns (sender, receiver, audit_log) with refreshed balances.
    """
    if amount <= Decimal("0"):
        raise ValueError("Amount must be greater than zero")

    # start a transaction (use a nested/savepoint if the session already has an active transaction)
    if db.in_transaction():
        tx_cm = db.begin_nested()
    else:
        tx_cm = db.begin()

    with tx_cm:
        # reload sender with FOR UPDATE to avoid races when supported by the DB.
        # Some dialects (SQLite) don't support FOR UPDATE; fall back to a plain select.
        try:
            sender_row = db.query(User).filter(User.id == sender.id).with_for_update().one_or_none()
        except Exception:
            sender_row = db.query(User).filter(User.id == sender.id).one_or_none()
        if not sender_row:
            raise ValueError("Sender not found")
        try:
            receiver = db.query(User).filter(User.email == receiver_email).with_for_update().one_or_none()
        except Exception:
            receiver = db.query(User).filter(User.email == receiver_email).one_or_none()
        if not receiver:
            raise ValueError("Receiver not found")

        # ensure sufficient balance
        if sender_row.balance is None:
            sender_row.balance = Decimal("0.00")
        if receiver.balance is None:
            receiver.balance = Decimal("0.00")

        if sender_row.balance < amount:
            raise ValueError("Insufficient balance")

        # perform balances update
        sender_row.balance = sender_row.balance - amount
        receiver.balance = receiver.balance + amount

        # create audit log (include optional note)
        audit = AuditLog(sender_id=sender_row.id, receiver_id=receiver.id, amount=amount, status="SUCCESS", note=note)
        db.add(audit)

        # flush to assign ids
        db.flush()

        # refresh to get latest values
        db.refresh(sender_row)
        db.refresh(receiver)
        db.refresh(audit)

    return sender_row, receiver, audit
