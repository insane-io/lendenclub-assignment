from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..user.routes import _get_current_user_from_token
    from .controller import transfer_funds
    from .schema import TransferRequest, TransferResult
    from .models import AuditLog
    from ..user.models import User
    from ..user.auth import verify_password
    # sse manager
    from ..sse.sse_manager import sse_manager
except Exception:
    from database import get_db
    from user.routes import _get_current_user_from_token
    from transaction.controller import transfer_funds
    from transaction.schema import TransferRequest, TransferResult
    from transaction.models import AuditLog
    from user.models import User
    from user.auth import verify_password
    from sse.sse_manager import sse_manager


router = APIRouter()


@router.post("/transfer", response_model=TransferResult)
def transfer(payload: TransferRequest, current_user=Depends(_get_current_user_from_token), db: Session = Depends(get_db)):
    try:
        amount = Decimal(str(payload.amount))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid amount")

    # Verify payment PIN
    if not getattr(current_user, "hashed_pin", None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment PIN not set for this account")
    if not verify_password(payload.pin, current_user.hashed_pin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid payment PIN")

    try:
        sender, receiver, audit = transfer_funds(db, current_user, payload.receiver_email, amount, getattr(payload, 'note', None))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        # unexpected — include message to aid debugging (remove in production)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Transfer failed: {exc}")

    result = {
        "sender_id": sender.id,
        "receiver_id": receiver.id,
        "amount": float(audit.amount),
        "sender_balance": float(sender.balance),
        "receiver_balance": float(receiver.balance),
    }

    # publish SSE events to receiver and sender (non-blocking, thread-safe)
    try:
        sse_manager.publish(receiver.id, {"event": "transfer", **result})
        sse_manager.publish(sender.id, {"event": "transfer", **result})
    except Exception:
        # don't break the API if SSE publish fails
        pass

    return result


@router.get("/transactions")
def transactions(current_user=Depends(_get_current_user_from_token), db: Session = Depends(get_db)):
    """Return sent and received transactions for the current user, newest first.

    Each item contains: id, type ('debited'|'credited'), sender_name, receiver_name, amount, created_at (ISO).
    """
    try:
        rows = (
            db.query(AuditLog)
            .filter((AuditLog.sender_id == current_user.id) | (AuditLog.receiver_id == current_user.id))
            .order_by(AuditLog.created_at.desc())
            .all()
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    out = []
    for r in rows:
        # determine type: if current user is the sender they were debited, otherwise they were credited
        txn_type = "debited" if r.sender_id == current_user.id else "credited"

        # get names from relationship if available, else query fallback
        sender_name = None
        receiver_name = None
        try:
            sender_name = getattr(r.sender, "name", None)
        except Exception:
            sender_name = None
        try:
            receiver_name = getattr(r.receiver, "name", None)
        except Exception:
            receiver_name = None

        if sender_name is None:
            u = db.query(User).filter(User.id == r.sender_id).first()
            sender_name = u.name if u else None
        if receiver_name is None:
            u = db.query(User).filter(User.id == r.receiver_id).first()
            receiver_name = u.name if u else None

        created_at = r.created_at.isoformat() if getattr(r, "created_at", None) is not None else None

        out.append(
            {
                "id": r.id,
                "type": txn_type,
                "sender_name": sender_name,
                "receiver_name": receiver_name,
                "amount": float(r.amount) if r.amount is not None else None,
                "note": getattr(r, "note", None),
                "created_at": created_at,
            }
        )

    return out
