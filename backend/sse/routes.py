import json
from typing import AsyncGenerator
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse

try:
    from ..user.auth import decode_access_token
    from .sse_manager import sse_manager
except Exception:
    from user.auth import decode_access_token
    from sse.sse_manager import sse_manager


router = APIRouter(prefix="/sse")


@router.get("/stream")
async def stream(request: Request, token: str | None = None):
    """SSE stream endpoint.
    Accepts token as query param (?token=...) or Authorization: Bearer <token>.
    Yields server-sent events for the authenticated user.
    """
    auth_token = token
    if not auth_token:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            auth_token = auth_header.split(" ", 1)[1]

    if not auth_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        payload = decode_access_token(auth_token)
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    q = sse_manager.subscribe(user_id)

    async def event_generator() -> AsyncGenerator[bytes, None]:
        try:
            while True:
                # if client disconnected, break loop
                if await request.is_disconnected():
                    break
                data = await q.get()
                # ensure JSON string, send as SSE "data: <json>\n\n"
                yield f"data: {json.dumps(data)}\n\n".encode("utf-8")
        finally:
            sse_manager.unsubscribe(user_id, q)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
