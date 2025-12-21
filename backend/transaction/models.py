from sqlalchemy import (
    Column,
    Integer,
    Numeric,
    ForeignKey,
    DateTime,
    func,
    Index,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy import event

try:
    from ..database import Base
except Exception:
    from database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    sender_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    amount = Column(Numeric(18, 2), nullable=False)

    # Optional note describing the payment (user-supplied)
    note = Column(String(512), nullable=True)

    status = Column(String(20), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_logs")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_logs")

    def __repr__(self) -> str:  # pragma: no cover - convenience
        return f"<AuditLog id={self.id} {self.sender_id}->{self.receiver_id} amount={self.amount} status={self.status}>"


Index("ix_audit_logs_sender", AuditLog.sender_id)
Index("ix_audit_logs_receiver", AuditLog.receiver_id)
Index("ix_audit_logs_created", AuditLog.created_at)


@event.listens_for(AuditLog, "before_update", propagate=True)
def _prevent_audit_update(mapper, connection, target):
    raise ValueError("AuditLog is immutable: update operations are not allowed")


@event.listens_for(AuditLog, "before_delete", propagate=True)
def _prevent_audit_delete(mapper, connection, target):
    raise ValueError("AuditLog is immutable: delete operations are not allowed")
