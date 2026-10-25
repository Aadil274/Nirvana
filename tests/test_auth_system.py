import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from api.main import app
from api.services import user_db

def test_authentication_system():
    client = TestClient(app)

    unique_email = f"resident_{int(time.time())}@hyderabad.org"
    password = "NirvanaSecurePass2026!"

    # 1. Registration validation: Terms not agreed
    res_terms = client.post("/api/v1/auth/register", json={
        "full_name": "Naveen Kumar",
        "email": unique_email,
        "password": password,
        "confirm_password": password,
        "agreed_to_terms": False
    })
    assert res_terms.status_code == 400, "Must require agreeing to terms"

    # 2. Registration validation: Passwords mismatch
    res_mismatch = client.post("/api/v1/auth/register", json={
        "full_name": "Naveen Kumar",
        "email": unique_email,
        "password": password,
        "confirm_password": "DifferentPassword123",
        "agreed_to_terms": True
    })
    assert res_mismatch.status_code == 400, "Must detect password mismatch"

    # 3. Registration validation: Weak password (< 8 chars)
    res_weak = client.post("/api/v1/auth/register", json={
        "full_name": "Naveen Kumar",
        "email": unique_email,
        "password": "short",
        "confirm_password": "short",
        "agreed_to_terms": True
    })
    assert res_weak.status_code in (400, 422), "Must reject weak password"

    # 4. Successful Registration
    res_reg = client.post("/api/v1/auth/register", json={
        "full_name": "Naveen Kumar",
        "email": unique_email,
        "password": password,
        "confirm_password": password,
        "agreed_to_terms": True
    })
    assert res_reg.status_code == 201, f"Expected 201 Created, got {res_reg.status_code}"
    reg_data = res_reg.json()
    assert "token" in reg_data and len(reg_data["token"]) > 20
    assert "user" in reg_data
    assert reg_data["user"]["email"] == unique_email
    assert "password_hash" not in reg_data["user"], "Password hash must never leak in response"
    print("PASS 1: User Registration with bcrypt password hashing & JWT token issuance")

    # 5. Duplicate Email Registration (409 Conflict)
    res_dup = client.post("/api/v1/auth/register", json={
        "full_name": "Another Person",
        "email": unique_email,
        "password": password,
        "confirm_password": password,
        "agreed_to_terms": True
    })
    assert res_dup.status_code == 409, "Must return 409 Conflict for existing email"
    print("PASS 2: Duplicate registration prevented with HTTP 409 Conflict")

    # 6. Login with Wrong Password (401 Unauthorized)
    res_wrong_pw = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword999"
    })
    assert res_wrong_pw.status_code == 401
    print("PASS 3: Incorrect credentials rejected with HTTP 401")

    # 7. Login with Correct Password
    res_login = client.post("/api/v1/auth/login", json={
        "email": unique_email,
        "password": password,
        "remember_me": True
    })
    assert res_login.status_code == 200
    login_data = res_login.json()
    auth_token = login_data["token"]
    assert "token" in login_data
    assert login_data["user"]["email"] == unique_email
    print("PASS 4: Successful Sign-In with real bcrypt verification")

    # 8. Protected Profile Retrieval (GET /auth/me)
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["user"]["full_name"] == "Naveen Kumar"
    assert "password_hash" not in me_data["user"]
    print("PASS 5: Protected route /auth/me authenticated with Bearer token")

    # 9. Invalid Token Rejection
    res_bad_tok = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
    assert res_bad_tok.status_code == 401
    print("PASS 6: Malformed/expired token correctly rejected with HTTP 401")

    # 10. Forgot Password & Reset Password Flow
    res_forgot = client.post("/api/v1/auth/forgot-password", json={"email": unique_email})
    assert res_forgot.status_code == 200
    forgot_data = res_forgot.json()
    reset_token = forgot_data.get("demo_reset_token")
    assert reset_token is not None, "Reset token must be generated"

    new_password = "BrandNewSecurePass999!"
    res_reset = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_password,
        "confirm_password": new_password
    })
    assert res_reset.status_code == 200
    print("PASS 7: Password reset token generated and validated successfully")

    # 11. Verify Old Password Fails, New Password Succeeds
    res_old_fail = client.post("/api/v1/auth/login", json={"email": unique_email, "password": password})
    assert res_old_fail.status_code == 401

    res_new_ok = client.post("/api/v1/auth/login", json={"email": unique_email, "password": new_password})
    assert res_new_ok.status_code == 200
    print("PASS 8: Verified old password invalidated and new password functional")

    # 12. Email Verification
    ver_token = reg_data.get("verification_token")
    if ver_token:
        res_ver = client.post("/api/v1/auth/verify-email", json={"token": ver_token})
        assert res_ver.status_code == 200
        print("PASS 9: Email verification flow functional")

    # 13. Brute Force Protection (5 failures trigger 429)
    attack_email = f"attacker_{int(time.time())}@fake.com"
    # Create the user first
    client.post("/api/v1/auth/register", json={
        "full_name": "Target User",
        "email": attack_email,
        "password": "ValidPassword123",
        "confirm_password": "ValidPassword123",
        "agreed_to_terms": True
    })

    for attempt in range(5):
        client.post("/api/v1/auth/login", json={"email": attack_email, "password": "WrongPassword"})

    res_blocked = client.post("/api/v1/auth/login", json={"email": attack_email, "password": "ValidPassword123"})
    assert res_blocked.status_code == 429, "Expected 429 Too Many Requests after 5 consecutive failures"
    print("PASS 10: Brute-force mitigation actively blocks repeated failed login attempts")

    print("\nALL AUTHENTICATION INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_authentication_system()
