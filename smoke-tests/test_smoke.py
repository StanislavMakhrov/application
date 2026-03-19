"""
Smoke tests for GrünBilanz MVP.

These tests verify the application is running and key pages are reachable.
They run against the Docker container in CI after the build step.

Auth-protected routes redirect to /login for unauthenticated requests.
Public auth pages (login, register) render normally.
"""

import os
import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def test_root_redirects_or_responds():
    """Root path should respond with an HTTP 200 (redirect handled by Next.js SSR)."""
    response = requests.get(BASE_URL, allow_redirects=True, timeout=10)
    assert response.status_code == 200, (
        f"Expected 200, got {response.status_code}. Body: {response.text[:200]}"
    )


def test_login_page_loads():
    """Login page should render with German content."""
    response = requests.get(f"{BASE_URL}/login", timeout=10)
    assert response.status_code == 200
    assert "Anmelden" in response.text or "GrünBilanz" in response.text, (
        "Login page should contain 'Anmelden' or 'GrünBilanz'"
    )


def test_register_page_loads():
    """Registration page should render."""
    response = requests.get(f"{BASE_URL}/register", timeout=10)
    assert response.status_code == 200
    assert "registrier" in response.text.lower() or "GrünBilanz" in response.text, (
        "Register page should contain registration content"
    )


def test_onboarding_redirects_unauthenticated():
    """Dashboard pages redirect unauthenticated users to /login."""
    response = requests.get(f"{BASE_URL}/onboarding", allow_redirects=True, timeout=10)
    # After redirect chain the final URL should be /login and respond with 200
    assert response.status_code == 200, (
        f"Expected 200 after redirect, got {response.status_code}"
    )
    assert "login" in response.url.lower() or "Anmelden" in response.text, (
        "Unauthenticated onboarding access should end up on the login page"
    )


def test_energy_redirects_unauthenticated():
    """Energy input page redirects unauthenticated users to /login."""
    response = requests.get(f"{BASE_URL}/energy", allow_redirects=True, timeout=10)
    assert response.status_code == 200
    assert "login" in response.url.lower() or "Anmelden" in response.text


def test_results_redirects_unauthenticated():
    """Results page redirects unauthenticated users to /login."""
    response = requests.get(f"{BASE_URL}/results/2023", allow_redirects=True, timeout=10)
    assert response.status_code == 200
    assert "login" in response.url.lower() or "Anmelden" in response.text
