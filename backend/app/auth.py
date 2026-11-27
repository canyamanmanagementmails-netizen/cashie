from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import Cookie, HTTPException, Response, status
from pydantic import BaseModel, Field

SESSION_COOKIE = "cashie_session"
SESSION_TTL = timedelta(days=7)
PBKDF2_ITERATIONS = 600_000
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def database_path() -> Path:
    configured = os.getenv("CASHIE_DATABASE_PATH")
    return Path(configured) if configured else Path(__file__).resolve().parents[1] / "cashie.db"


def connect() -> sqlite3.Connection:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_auth_database() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
            """
        )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(candidate.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def issue_session(user_id: int, response: Response) -> None:
    token = secrets.token_urlsafe(32)
    now = now_utc()
    expires_at = now + SESSION_TTL
    with connect() as connection:
        connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (now.isoformat(),))
        connection.execute(
            "INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (hashlib.sha256(token.encode()).hexdigest(), user_id, expires_at.isoformat(), now.isoformat()),
        )
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=os.getenv("CASHIE_COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=10, max_length=128)


def normalized_email(email: str) -> str:
    value = email.strip().lower()
    if len(value) > 254 or not EMAIL_PATTERN.fullmatch(value):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return value


def register(credentials: Credentials, response: Response) -> dict[str, str]:
    email = normalized_email(credentials.email)
    now = now_utc().isoformat()
    try:
        with connect() as connection:
            cursor = connection.execute(
                "INSERT INTO users(email, password_hash, created_at) VALUES (?, ?, ?)",
                (email, hash_password(credentials.password), now),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
    issue_session(user_id, response)
    return {"email": email}


def login(credentials: Credentials, response: Response) -> dict[str, str]:
    email = normalized_email(credentials.email)
    with connect() as connection:
        user = connection.execute("SELECT id, email, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    if user is None or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    issue_session(user["id"], response)
    return {"email": user["email"]}


def current_user(cashie_session: str | None = Cookie(default=None, alias=SESSION_COOKIE)) -> dict[str, str]:
    if not cashie_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    token_hash = hashlib.sha256(cashie_session.encode()).hexdigest()
    now = now_utc().isoformat()
    with connect() as connection:
        user = connection.execute(
            "SELECT users.email FROM sessions JOIN users ON users.id = sessions.user_id "
            "WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
            (token_hash, now),
        ).fetchone()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    return {"email": user["email"]}


def logout(cashie_session: str | None, response: Response) -> dict[str, str]:
    if cashie_session:
        token_hash = hashlib.sha256(cashie_session.encode()).hexdigest()
        with connect() as connection:
            connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
    response.delete_cookie(key=SESSION_COOKIE, path="/", httponly=True, samesite="lax")
    return {"status": "signed out"}
