"""Basic smoke tests for the GrünBilanz application."""

import os
import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def test_dashboard_loads():
    """Dashboard page returns HTTP 200."""
    response = requests.get(f"{BASE_URL}/", timeout=10, allow_redirects=True)
    assert response.status_code == 200


def test_input_page_loads():
    """Input wizard page returns HTTP 200."""
    response = requests.get(f"{BASE_URL}/input", timeout=10, allow_redirects=True)
    assert response.status_code == 200
