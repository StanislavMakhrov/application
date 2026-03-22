import { test, expect } from "@playwright/test";

/**
 * Playwright e2e tests for GrünBilanz.
 * These tests verify that the Docker container starts correctly and serves
 * the core application pages and API endpoints.
 */

test.describe("App health", () => {
  test("dashboard loads with GrünBilanz branding", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    // The page should contain GrünBilanz branding or CO₂ content
    const body = await page.content();
    const hasBranding = body.includes("GrünBilanz") || body.includes("CO");
    expect(hasBranding).toBe(true);
  });

  test("entries API returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/entries?type=profile");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(typeof data).toBe("object");
  });

  test("badge API returns SVG or 404 when no reporting year exists", async ({
    request,
  }) => {
    const response = await request.get("/api/badge?yearId=1&format=svg");
    const status = response.status();
    // 200 with SVG when a year exists, 404 when it doesn't (both are valid)
    expect([200, 404]).toContain(status);
    if (status === 200) {
      const body = await response.text();
      expect(body).toContain("<svg");
    }
  });
});
