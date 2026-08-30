
def test_signup_user(client, seeded_db):
    payload = {
        "email": "new.analyst@acme.com",
        "password": "Password123!",
        "full_name": "Alex Mercer",
        "role": "COMPENSATION_ANALYST"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "new.analyst@acme.com"
    assert data["user"]["full_name"] == "Alex Mercer"
    assert data["user"]["role"] == "COMPENSATION_ANALYST"

def test_signup_duplicate_email(client, seeded_db):
    payload = {
        "email": "hr.manager@acme.com",
        "password": "Password123!",
        "full_name": "Duplicate Person",
        "role": "HR_MANAGER"
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client, seeded_db):
    payload = {
        "email": "hr.manager@acme.com",
        "password": "Password123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "hr.manager@acme.com"

def test_login_invalid_password(client, seeded_db):
    payload = {
        "email": "hr.manager@acme.com",
        "password": "WrongPassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_get_current_user_me(client, seeded_db):
    # Login to get token
    login_resp = client.post("/api/v1/auth/login", json={"email": "hr.manager@acme.com", "password": "Password123"})
    token = login_resp.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "hr.manager@acme.com"
    assert data["role"] == "HR_MANAGER"
