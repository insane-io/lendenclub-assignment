from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.orm import relationship

try:
    from ..database import Base
except Exception:
    from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(320), nullable=False, unique=True, index=True)

    # Hashed password for authentication
    hashed_password = Column(String(1024), nullable=False)
    # Hashed payment PIN (optional for older users)
    hashed_pin = Column(String(1024), nullable=True)

    # Balance stored as Numeric(18, 2)
    balance = Column(Numeric(18, 2), nullable=False, default=Decimal("0.00"), server_default="0")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships to AuditLog will be declared by AuditLog (string names used)
    sent_logs = relationship(
        "AuditLog",
        foreign_keys="AuditLog.sender_id",
        back_populates="sender",
        cascade="none",
        passive_deletes=True,
    )

    received_logs = relationship(
        "AuditLog",
        foreign_keys="AuditLog.receiver_id",
        back_populates="receiver",
        cascade="none",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - convenience
        return f"<User id={self.id} email={self.email} balance={self.balance}>"
