"""
database.py

Engine, SessionLocal and Base for SQLAlchemy.

Design notes:
- Uses DATABASE_URL environment variable; defaults to a persistent SQLite file for local development
  but works with a PostgreSQL URL (psycopg) in production.
- Session dependency `get_db` yields a session, commits on successful request handling,
  rolls back on exception, and always closes the session. This pattern makes request-level
  operations atomic by default; for multi-step transfers prefer `with db.begin():` inside
  your business logic to ensure a single transactional boundary.
"""
from typing import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session


# Read DATABASE_URL from env. Examples:
# - SQLite: sqlite:///./data.db
# - Postgres: postgresql+psycopg://user:pass@host:5432/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data.db")


# SQLite needs check_same_thread=False when used with multiple threads (FastAPI/uvicorn).
# For other backends (Postgres) connect_args should be empty.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}


engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)


# Configure sessionmaker: do not autocommit, do not autoflush by default.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True, class_=Session)


# Declarative base for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy Session.

    Behavior:
    - Yields a session to the caller.
    - After the caller finishes without raising, commits the session.
    - If an exception propagates, rolls back the session and re-raises.
    - Always closes the session.

    Note: For application-level transactions involving multiple operations that must all
    succeed or fail together, prefer using an explicit transaction context inside handlers:
        with db.begin():
            # multiple DB operations here are atomic

    This function balances pragmatic default request-level commit behavior with the
    ability to do fine-grained transactional control where needed.
    """
    db: Session = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """Utility to create DB tables. Call from a startup script or REPL if needed."""
    Base.metadata.create_all(bind=engine)
