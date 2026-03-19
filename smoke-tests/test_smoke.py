"""
Smoke tests for GrünBilanz MVP.

These tests verify the application is running and key pages are reachable.
They run against the Docker container in CI after the build step.

The app runs in demo mode (no Supabase credentials), so auth-protected routes
render the demo banner instead of redirecting to login.
"""

import os
import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def test_root_redirects_or_responds():
    """Root path should respond with an HTTP 200 (redirect handled by next.js SSR)."""
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


def test_onboarding_page_accessible_in_demo_mode():
    """Dashboard pages should be accessible in demo mode (no Supabase credentials)."""
    response = requests.get(f"{BASE_URL}/onboarding", timeout=10)
    assert response.status_code == 200, (
        f"Onboarding should be accessible in demo mode, got {response.status_code}"
    )


def test_energy_page_accessible_in_demo_mode():
    """Energy input page should be accessible in demo mode."""
    response = requests.get(f"{BASE_URL}/energy", timeout=10)
    assert response.status_code == 200


def test_results_page_accessible_in_demo_mode():
    """Results page for a given year should be accessible in demo mode."""
    response = requests.get(f"{BASE_URL}/results/2023", timeout=10)
    assert response.status_code == 200
