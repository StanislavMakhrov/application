"""Basic smoke tests for the GrünBilanz application."""

import os
import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
PDF_GENERATION_TIMEOUT = 30


def assert_valid_pdf_response(response: requests.Response) -> None:
    """Assert that a response is a valid PDF file."""
    assert response.status_code == 200, (
        f"Expected 200 but got {response.status_code}: {response.text[:500]}"
    )
    assert response.headers.get("Content-Type", "").startswith("application/pdf"), (
        f"Expected application/pdf but got {response.headers.get('Content-Type')}: {response.text[:200]}"
    )
    assert response.content[:4] == b"%PDF", (
        "Response body does not start with %PDF — not a valid PDF"
    )


def test_dashboard_loads():
    """Dashboard page returns HTTP 200."""
    response = requests.get(f"{BASE_URL}/", timeout=10, allow_redirects=True)
    assert response.status_code == 200


def test_input_page_loads():
    """Input wizard page returns HTTP 200."""
    response = requests.get(f"{BASE_URL}/input", timeout=10, allow_redirects=True)
    assert response.status_code == 200


def test_pdf_report_generates():
    """PDF report endpoint returns a valid PDF file."""
    response = requests.get(
        f"{BASE_URL}/api/report", timeout=PDF_GENERATION_TIMEOUT, allow_redirects=True
    )
    assert_valid_pdf_response(response)


def test_badge_pdf_generates():
    """Sustainability badge endpoint returns a valid PDF file."""
    response = requests.get(
        f"{BASE_URL}/api/badge", timeout=PDF_GENERATION_TIMEOUT, allow_redirects=True
    )
    assert_valid_pdf_response(response)


def test_csrd_pdf_generates():
    """CSRD questionnaire endpoint returns a valid PDF file."""
    response = requests.get(
        f"{BASE_URL}/api/csrd", timeout=PDF_GENERATION_TIMEOUT, allow_redirects=True
    )
    assert_valid_pdf_response(response)
