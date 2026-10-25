"""
Nirvana Civic Climate Resilience Platform
SQLite User Persistence & Database Layer

Provides atomic, ACID-compliant storage for user authentication,
hashed credentials, verification tokens, password resets, and brute-force tracking.
"""

import sqlite3
import os
import time
import uuid
from typing import Optional, Dict, Any

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "nirvana_auth.db")

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'citizen',
                ward_id TEXT DEFAULT 'ward-72',
                is_verified INTEGER DEFAULT 0,
                verification_token TEXT,
                reset_token TEXT,
                reset_token_expires_at REAL,
                created_at TEXT NOT NULL,
                last_login_at TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS failed_logins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                ip_address TEXT,
                attempt_time REAL NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_failed_email ON failed_logins(email, attempt_time)")
        conn.commit()

# Initialize tables upon module import
init_db()

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    norm_email = email.strip().lower()
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (norm_email,)).fetchone()
        if row:
            return dict(row)
    return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if row:
            return dict(row)
    return None

def create_user(
    full_name: str,
    email: str,
    password_hash: str,
    role: str = "citizen",
    ward_id: str = "ward-72",
    is_verified: bool = False,
    verification_token: Optional[str] = None
) -> Dict[str, Any]:
    norm_email = email.strip().lower()
    user_id = f"usr_{uuid.uuid4().hex}"
    created_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO users (id, email, full_name, password_hash, role, ward_id, is_verified, verification_token, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                norm_email,
                full_name.strip(),
                password_hash,
                role,
                ward_id,
                1 if is_verified else 0,
                verification_token,
                created_at
            )
        )
        conn.commit()

    return get_user_by_id(user_id)  # type: ignore

def update_last_login(user_id: str):
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    with get_connection() as conn:
        conn.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (now, user_id))
        conn.commit()

def set_reset_token(email: str, token: str, expires_at: float):
    norm_email = email.strip().lower()
    with get_connection() as conn:
        conn.execute(
            "UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE email = ?",
            (token, expires_at, norm_email)
        )
        conn.commit()

def get_user_by_reset_token(token: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE reset_token = ?", (token,)).fetchone()
        if row:
            return dict(row)
    return None

def update_password(user_id: str, new_password_hash: str):
    with get_connection() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?",
            (new_password_hash, user_id)
        )
        conn.commit()

def verify_user_email(token: str) -> bool:
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM users WHERE verification_token = ?", (token,)).fetchone()
        if row:
            conn.execute("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?", (row["id"],))
            conn.commit()
            return True
    return False

def record_failed_login(email: str, ip: str):
    norm_email = email.strip().lower()
    now = time.time()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO failed_logins (email, ip_address, attempt_time) VALUES (?, ?, ?)",
            (norm_email, ip, now)
        )
        conn.commit()

def get_failed_login_count(email: str, ip: str, window_seconds: int = 900) -> int:
    norm_email = email.strip().lower()
    threshold = time.time() - window_seconds
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as cnt FROM failed_logins WHERE email = ? AND attempt_time > ?",
            (norm_email, threshold)
        )
        return row.fetchone()["cnt"]

def clear_failed_logins(email: str, ip: str):
    norm_email = email.strip().lower()
    with get_connection() as conn:
        conn.execute("DELETE FROM failed_logins WHERE email = ?", (norm_email,))
        conn.commit()
