from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_root_ok():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Resume Screening API"}


def test_cors_allows_frontend_origin():
    response = client.options(
        "/screen",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_cors_rejects_unknown_origin():
    response = client.options(
        "/screen",
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in response.headers