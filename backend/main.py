import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path
import asyncio

# Handle relative vs absolute imports based on execution context
try:
    from .database import init_db
    from .user import models as user_models
    from .transaction import models as tx_models
    from .user import routes as user_routes
    from .transaction import routes as transaction_routes
    # sse support
    from .sse import routes as sse_routes
    from .sse.sse_manager import sse_manager
except (ImportError, Exception):
    from database import init_db
    import user.models as user_models  # type: ignore
    import transaction.models as tx_models  # type: ignore
    import user.routes as user_routes  # type: ignore
    import transaction.routes as transaction_routes  # type: ignore
    from sse import routes as sse_routes  # type: ignore
    from sse.sse_manager import sse_manager  # type: ignore

# Setup Logging
logger = logging.getLogger(__name__)

app = FastAPI(title="My API")

# --- CORS CONFIGURATION ---
# Replace ["*"] with specific domains in production (e.g., ["https://myapp.com"])
origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER MOUNTING ---
# mount user router under /auth
app.include_router(user_routes.router, prefix="/auth")
# mount transfer endpoint at /transfer
app.include_router(transaction_routes.router)

# mount sse router
app.include_router(sse_routes.router)


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
        # initialize sse manager event loop so publish can be called from sync code
        try:
            loop = asyncio.get_event_loop()
            sse_manager.init_loop(loop)
        except Exception:
            pass

        logger.info("Database initialized")
    except Exception:
        logger.exception("Database initialization failed")


@app.get("/")
def health_check():
    return {"status": "ok"}

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIST, html=True),
    name="frontend",
)