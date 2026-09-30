"""API tests for input checks, using a throwaway database (see conftest.py)."""
import pytest
from fastapi.testclient import TestClient

from app.database.session import Base, engine, SessionLocal
from app.models.exercise import Exercise
import app.models  # noqa: F401  (register every table)


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.add(Exercise(name="Chin Tucks", body_part="Neck", target_issue="forward_neck"))
    db.commit()
    db.close()
    from main import app
    return TestClient(app)


def register(client, email, name="Test User", password="goodpass123"):
    return client.post("/api/v1/auth/register", json={"email": email, "full_name": name, "password": password})


def login(client, email, password="goodpass123"):
    r = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    return r


def auth(client, email):
    register(client, email)
    token = login(client, email).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_rejects_blank_name_and_blank_password(client):
    assert register(client, "a1@example.com", name="   ").status_code == 422
    assert register(client, "a2@example.com", password="          ").status_code == 422


def test_register_rejects_passwords_over_72_bytes(client):
    assert register(client, "a3@example.com", password="x" * 73).status_code == 422


def test_emails_are_case_insensitive(client):
    assert register(client, "Mixed.Case@Example.com").status_code == 201
    assert register(client, "mixed.case@example.com").status_code == 400
    assert login(client, "MIXED.case@example.com").status_code == 200


def test_session_needs_a_real_exercise_and_sane_numbers(client):
    h = auth(client, "s1@example.com")
    assert client.post("/api/v1/exercises/sessions", json={"exercise_id": 99999}, headers=h).status_code == 404
    assert client.post("/api/v1/exercises/sessions", json={"exercise_id": 1, "form_score": 900}, headers=h).status_code == 422
    assert client.post("/api/v1/exercises/sessions", json={"exercise_id": 1, "completed_reps": -3}, headers=h).status_code == 422
    ok = client.post("/api/v1/exercises/sessions", json={"exercise_id": 1, "completed_reps": 5, "form_score": 90}, headers=h)
    assert ok.status_code == 200
    assert client.get("/api/v1/rehab/history", headers=h).status_code == 200


def test_profile_name_cannot_be_removed(client):
    h = auth(client, "p1@example.com")
    assert client.put("/api/v1/users/profile", json={"full_name": None}, headers=h).status_code == 422
    assert client.put("/api/v1/users/profile", json={"age": 99999}, headers=h).status_code == 422
    r = client.put("/api/v1/users/profile", json={"full_name": "  New Name ", "age": 23}, headers=h)
    assert r.status_code == 200 and r.json()["full_name"] == "New Name" and r.json()["age"] == 23


def test_exercise_routes(client):
    h = auth(client, "e1@example.com")
    assert client.get("/api/v1/exercises/sessions", headers=h).status_code == 200
    assert client.get("/api/v1/exercises/9999", headers=h).status_code == 404
    # Users can't add to the shared exercise library
    assert client.post("/api/v1/exercises", json={"name": "x", "body_part": "y"}, headers=h).status_code == 405


def test_endpoints_need_login(client):
    for path in ("/api/v1/assessments/history", "/api/v1/rehab/history", "/api/v1/focus/sessions", "/api/v1/users/profile"):
        assert client.get(path).status_code == 401
