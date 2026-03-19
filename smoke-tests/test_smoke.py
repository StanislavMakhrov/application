"""
Smoke tests for GrünBilanz.
Verifies that the application starts and key pages are reachable.
Run with: pytest smoke-tests/ -v --tb=short
"""
import os
import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def test_root_reachable():
    """Root URL should respond with a valid HTTP status (redirect to /login is acceptable)."""
    response = requests.get(BASE_URL, allow_redirects=False, timeout=10)
    # Next.js static redirect() returns 307 without a Location header —
    # this is intentional SSR redirect behaviour, not an error.
    assert response.status_code in (200, 301, 302, 307, 308)


def test_login_page():
    """Login page should return HTTP 200."""
    response = requests.get(f"{BASE_URL}/login", timeout=10)
    assert response.status_code == 200


def test_signup_page():
    """Sign-up page should return HTTP 200."""
    response = requests.get(f"{BASE_URL}/signup", timeout=10)
    assert response.status_code == 200


def test_login_page_contains_german_text():
    """Login page should contain German UI text."""
    response = requests.get(f"{BASE_URL}/login", timeout=10)
    assert response.status_code == 200
    assert "GrünBilanz" in response.text or "Anmelden" in response.text
