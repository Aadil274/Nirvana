"""
Nirvana Civic Climate Resilience Platform
Authentication API Routes

Provides secure user registration, credential verification, JWT issuance,
password recovery, and session validation.
"""

import time
import secrets
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header, status
from pydantic import BaseModel, Field

from api.services import user_db, auth_service

router = APIRouter(prefix="/auth", tags=["Authentication & User Accounts"])

# Request & Response Schemas
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = "citizen"
    ward_id: Optional[str] = "ward-72"
    agreed_to_terms: bool = True

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: bool = True

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10)

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    # 1. Validate Terms agreement
    if not payload.agreed_to_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must agree to the civic terms and privacy notice to create an account."
        )

    # 2. Validate email format
    if not auth_service.validate_email_format(payload.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address (e.g. resident@example.com)."
        )

    # 3. Check password confirmation match
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please re-enter your password."
        )

    # 4. Enforce password policy
    pw_err = auth_service.validate_password_strength(payload.password)
    if pw_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_err
        )

    # 5. Check duplicate email
    existing = user_db.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead."
        )

    # 6. Hash password with bcrypt and generate verification token
    hashed_pw = auth_service.hash_password(payload.password)
    ver_token = secrets.token_urlsafe(32)

    user = user_db.create_user(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hashed_pw,
        role=payload.role or "citizen",
        ward_id=payload.ward_id or "ward-72",
        is_verified=False,
        verification_token=ver_token
    )

    # 7. Generate JWT session token
    token = auth_service.generate_jwt_token(user, remember_me=True)

    return {
        "status": "registered",
        "message": "Account created successfully. Welcome to Nirvana Civic Network.",
        "user": auth_service.sanitize_user_dict(user),
        "token": token,
        "verification_token": ver_token
    }

@router.post("/login")
def login(payload: LoginRequest, request: Request):
    client_ip = get_client_ip(request)

    # 1. Check brute force attempts (Rate limit: max 5 failed attempts in 15 mins)
    failures = user_db.get_failed_login_count(payload.email, client_ip, window_seconds=900)
    if failures >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed sign-in attempts. For your security, this account is temporarily locked for 15 minutes. Please try again later or reset your password."
        )

    # 2. Look up user
    user = user_db.get_user_by_email(payload.email)
    if not user:
        user_db.record_failed_login(payload.email, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please check your credentials."
        )

    # 3. Verify password with bcrypt
    is_valid = auth_service.verify_password(payload.password, user["password_hash"])
    if not is_valid:
        user_db.record_failed_login(payload.email, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password. Please check your credentials."
        )

    # 4. Successful login: clear failure counter and update timestamp
    user_db.clear_failed_logins(payload.email, client_ip)
    user_db.update_last_login(user["id"])

    # 5. Issue JWT session token
    token = auth_service.generate_jwt_token(user, remember_me=payload.remember_me)

    return {
        "status": "authenticated",
        "message": "Signed in successfully.",
        "user": auth_service.sanitize_user_dict(user),
        "token": token
    }

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header."
        )

    raw_token = authorization.split("Bearer ", 1)[1].strip()
    payload = auth_service.decode_jwt_token(raw_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )

    user = user_db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists."
        )

    return {
        "status": "authenticated",
        "user": auth_service.sanitize_user_dict(user)
    }

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    if not auth_service.validate_email_format(payload.email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address."
        )

    user = user_db.get_user_by_email(payload.email)
    demo_token = None

    if user:
        token = secrets.token_urlsafe(32)
        expires_at = time.time() + 3600  # 1 hour
        user_db.set_reset_token(payload.email, token, expires_at)
        demo_token = token

    return {
        "status": "success",
        "message": "If an account exists with this email address, a password reset link has been dispatched.",
        "demo_reset_token": demo_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    pw_err = auth_service.validate_password_strength(payload.new_password)
    if pw_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pw_err
        )

    user = user_db.get_user_by_reset_token(payload.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link. Please request a new one."
        )

    if user["reset_token_expires_at"] and user["reset_token_expires_at"] < time.time():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has expired. Please request a new one."
        )

    new_hash = auth_service.hash_password(payload.new_password)
    user_db.update_password(user["id"], new_hash)

    return {
        "status": "success",
        "message": "Your password has been successfully reset. You may now sign in with your new credentials."
    }

@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest):
    ok = user_db.verify_user_email(payload.token)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired email verification link."
        )
    return {
        "status": "success",
        "message": "Your email address has been successfully verified."
    }

@router.post("/logout")
def logout():
    return {
        "status": "logged_out",
        "message": "You have been signed out."
    }
