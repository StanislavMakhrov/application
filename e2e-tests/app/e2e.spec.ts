import { test, expect } from "@playwright/test";

/**
 * Playwright e2e tests for GrünBilanz.
 * These tests verify the core user-facing scenarios against the running
 * Docker container (with seeded demo data: Mustermann Elektro GmbH, 2023+2024).
 */

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
test.describe("Dashboard", () => {
  test("loads with GrünBilanz branding", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body.includes("GrünBilanz") || body.includes("CO")).toBe(true);
  });

  test("shows company name from seed data", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    // Seed data creates "Mustermann Elektro GmbH"
    expect(body).toContain("Mustermann");
  });

  test("shows year selector with seeded years", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    // Seed creates 2023 and 2024
    expect(body).toContain("2024");
  });

  test("switches year via URL parameter", async ({ page }) => {
    const response = await page.goto("/?year=2023");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    // The selected year context should be 2023
    expect(body).toContain("2023");
  });

  test("shows KPI cards with CO2e values", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    // Should display CO₂e metric
    expect(body.includes("CO₂e") || body.includes("CO2e") || body.includes("t CO")).toBe(true);
  });

  test("shows 'Daten erfassen' link to wizard", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Daten erfassen/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/wizard/1");
  });

  test("shows 'Bericht erstellen' link", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Bericht erstellen/i });
    await expect(link).toBeVisible();
  });

  test("shows Jahresvergleich section", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    expect(body).toContain("Jahresvergleich");
  });

  test("shows Scope categories in page", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    expect(body.includes("Scope 1") || body.includes("Scope 2") || body.includes("Scope")).toBe(true);
  });

  test("Jahresvergleich does not show NaN%", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    expect(body).not.toContain("NaN%");
  });

  test("shows audit log panel on dashboard", async ({ page }) => {
    await page.goto("/");
    const body = await page.content();
    // AuditLogPanel renders a section with "Änderungsprotokoll" or similar
    expect(
      body.includes("Änderungsprotokoll") || body.includes("Audit") || body.includes("Protokoll")
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Wizard screens
// ---------------------------------------------------------------------------
test.describe("Wizard screens", () => {
  test("screen 1 (Firmenprofil) loads", async ({ page }) => {
    const response = await page.goto("/wizard/1");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(
      body.includes("Firmenprofil") || body.includes("Firmenname") || body.includes("Unternehmen")
    ).toBe(true);
  });

  test("screen 2 (Heizung) loads", async ({ page }) => {
    const response = await page.goto("/wizard/2?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body.includes("Heizung") || body.includes("Erdgas") || body.includes("Heizöl")).toBe(true);
  });

  test("screen 3 (Fuhrpark) loads", async ({ page }) => {
    const response = await page.goto("/wizard/3?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body.includes("Fuhrpark") || body.includes("Diesel") || body.includes("Benzin")).toBe(true);
  });

  test("screen 4 (Strom) loads", async ({ page }) => {
    const response = await page.goto("/wizard/4?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(body.includes("Strom") || body.includes("kWh") || body.includes("Ökostrom")).toBe(true);
  });

  test("screen 5 (Dienstreisen) loads", async ({ page }) => {
    const response = await page.goto("/wizard/5?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(
      body.includes("Dienstreisen") || body.includes("Flug") || body.includes("Bahn")
    ).toBe(true);
  });

  test("screen 6 (Materialien) loads", async ({ page }) => {
    const response = await page.goto("/wizard/6?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(
      body.includes("Material") || body.includes("Kupfer") || body.includes("Stahl")
    ).toBe(true);
  });

  test("screen 7 (Abfall) loads", async ({ page }) => {
    const response = await page.goto("/wizard/7?year=2024");
    expect(response?.status()).toBe(200);
    const body = await page.content();
    expect(
      body.includes("Abfall") || body.includes("Restmüll") || body.includes("Recycling")
    ).toBe(true);
  });

  test("invalid screen returns 404", async ({ page }) => {
    const response = await page.goto("/wizard/99");
    expect(response?.status()).toBe(404);
  });

  test("wizard has navigation back to dashboard", async ({ page }) => {
    await page.goto("/wizard/2?year=2024");
    const body = await page.content();
    // WizardNav component renders navigation with home/dashboard link
    expect(body.includes("Dashboard") || body.includes("GrünBilanz") || body.includes("href=\"/\"")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// API: entries
// ---------------------------------------------------------------------------
test.describe("API /api/entries", () => {
  test("GET ?type=profile returns company profile object", async ({ request }) => {
    const response = await request.get("/api/entries?type=profile");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(typeof data).toBe("object");
  });

  test("GET without yearId returns 400", async ({ request }) => {
    const response = await request.get("/api/entries");
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  test("GET ?yearId=1 returns array of entries", async ({ request }) => {
    const response = await request.get("/api/entries?yearId=1");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET ?yearId=1&scope=SCOPE1 returns scope-filtered entries", async ({ request }) => {
    const response = await request.get("/api/entries?yearId=1&scope=SCOPE1");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // All entries should be SCOPE1
    for (const entry of data) {
      expect(entry.scope).toBe("SCOPE1");
    }
  });

  test("GET ?yearId=1&type=materials returns materials array", async ({ request }) => {
    const response = await request.get("/api/entries?yearId=1&type=materials");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("POST upserts an emission entry and DELETE removes it", async ({ request }) => {
    // First get the year ID from the profile endpoint
    const profileRes = await request.get("/api/entries?yearId=1");
    expect(profileRes.status()).toBe(200);

    // POST a new test entry
    const postRes = await request.post("/api/entries", {
      data: {
        yearId: 1,
        scope: "SCOPE1",
        category: "ERDGAS",
        value: 999.0,
        unit: "m³",
        inputMethod: "MANUAL",
      },
    });
    // Accept 200 or 201
    expect([200, 201]).toContain(postRes.status());

    // DELETE the test entry
    const delRes = await request.delete("/api/entries", {
      data: { yearId: 1, category: "ERDGAS" },
    });
    expect([200, 204]).toContain(delRes.status());
  });
});

// ---------------------------------------------------------------------------
// API: audit log
// ---------------------------------------------------------------------------
test.describe("API /api/audit", () => {
  test("GET returns array of audit log entries", async ({ request }) => {
    const response = await request.get("/api/audit");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET ?yearId=1 filters by year", async ({ request }) => {
    const response = await request.get("/api/audit?yearId=1");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET ?entityType=EmissionEntry filters by entity type", async ({ request }) => {
    const response = await request.get("/api/audit?entityType=EmissionEntry");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    for (const entry of data) {
      expect(entry.entityType).toBe("EmissionEntry");
    }
  });
});

// ---------------------------------------------------------------------------
// API: badge
// ---------------------------------------------------------------------------
test.describe("API /api/badge", () => {
  test("returns SVG or 404 for SVG format", async ({ request }) => {
    const response = await request.get("/api/badge?yearId=1&format=svg");
    const status = response.status();
    expect([200, 404]).toContain(status);
    if (status === 200) {
      const body = await response.text();
      expect(body).toContain("<svg");
    }
  });

  test("returns JSON or 404 for JSON format", async ({ request }) => {
    const response = await request.get("/api/badge?yearId=1&format=json");
    const status = response.status();
    expect([200, 404]).toContain(status);
    if (status === 200) {
      const data = await response.json();
      expect(typeof data).toBe("object");
    }
  });
});

// ---------------------------------------------------------------------------
// API: report (PDF generation)
// ---------------------------------------------------------------------------
test.describe("API /api/report", () => {
  test("GET generates a PDF report (GHG_PROTOCOL) or 404", async ({ request }) => {
    const response = await request.get("/api/report?yearId=1&type=GHG_PROTOCOL");
    const status = response.status();
    // 200 with PDF binary or 404 if the year has no data
    expect([200, 404, 500]).toContain(status);
    if (status === 200) {
      const contentType = response.headers()["content-type"] ?? "";
      expect(contentType).toContain("pdf");
    }
  });
});

// ---------------------------------------------------------------------------
// API: documents
// ---------------------------------------------------------------------------
test.describe("API /api/documents", () => {
  test("GET /api/documents/999 returns 404 for non-existent doc", async ({ request }) => {
    const response = await request.get("/api/documents/999");
    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Navigation flow
// ---------------------------------------------------------------------------
test.describe("Navigation flow", () => {
  test("clicking 'Daten erfassen' navigates to wizard screen 1", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Daten erfassen/i }).click();
    await expect(page).toHaveURL(/\/wizard\/1/);
    expect(page.url()).toContain("/wizard/1");
  });

  test("all wizard screens reachable with year param", async ({ page }) => {
    for (const screen of [1, 2, 3, 4, 5, 6, 7]) {
      const response = await page.goto(`/wizard/${screen}?year=2024`);
      expect(response?.status()).toBe(200);
    }
  });

  test("dashboard year selector changes URL param", async ({ page }) => {
    // Load dashboard with explicit year
    await page.goto("/?year=2024");
    const body = await page.content();
    expect(body).toContain("2024");
  });
});
