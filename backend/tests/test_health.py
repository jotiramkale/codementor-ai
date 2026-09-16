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
