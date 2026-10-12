"""
tests/test_health.py

The one test that needs nothing else set up — no database, no env
vars beyond the defaults in app/config.py. A reasonable first thing to
run once dependencies are installed somewhere with network access:

    pytest tests/test_health.py -v

Not run in this sandbox (no internet access to install fastapi/httpx),
but this is straightforward, well-established FastAPI TestClient usage.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-request-id"]


def test_request_id_is_validated_and_propagated():
    response = client.get("/health", headers={"X-Request-ID": "check-123"})
    assert response.headers["x-request-id"] == "check-123"

    unsafe = client.get("/health", headers={"X-Request-ID": "bad\r\nid"})
    assert unsafe.status_code == 200
    assert unsafe.headers["x-request-id"] != "bad\r\nid"


def test_liveness_does_not_depend_on_database():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readiness_reports_database_outage_without_details(monkeypatch):
    from app import main

    class FailedEngine:
        def connect(self):
            raise RuntimeError("private database hostname")

    monkeypatch.setattr(main, "engine", FailedEngine())
    response = client.get("/health/ready")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
