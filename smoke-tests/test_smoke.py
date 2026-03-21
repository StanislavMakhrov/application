"""
Smoke tests for GrünBilanz.
Tests that the Docker container starts correctly and serves basic pages.
"""

import os
import time
import pytest
import urllib.request
import urllib.error
import json

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")


def http_get(path: str, timeout: int = 10):
    """Simple HTTP GET helper."""
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.status, response.read().decode("utf-8"), response.headers


class TestBasicHealth:
    """Basic health checks for the running container."""

    def test_dashboard_loads(self):
        """Dashboard returns HTTP 200."""
        status, body, _ = http_get("/")
        assert status == 200
        assert "GrünBilanz" in body or "CO" in body

    def test_entries_api_returns_json(self):
        """The entries API returns valid JSON."""
        status, body, headers = http_get("/api/entries?type=profile")
        assert status == 200
        # Should return JSON
        data = json.loads(body)
        assert isinstance(data, dict)

    def test_badge_api_returns_svg(self):
        """Badge API returns SVG when a year is available."""
        # First check if year 1 exists; if not, skip
        try:
            status, body, headers = http_get("/api/badge?yearId=1&format=svg")
            if status == 404:
                pytest.skip("No reporting year with id=1 found")
            assert status == 200
            assert "<svg" in body
        except urllib.error.HTTPError as e:
            if e.code == 404:
                pytest.skip("No reporting year with id=1 found")
            raise
