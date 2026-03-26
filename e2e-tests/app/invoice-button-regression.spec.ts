import { test, expect } from "@playwright/test";

/**
 * Regression tests for issue #003 — three invoice upload button bugs:
 *   Bug #1 (Duplicate): After uploading a file, two upload buttons appeared simultaneously.
 *   Bug #2 (Wrong label): Button read "Rechnung hochladen" instead of "Rechnung hinzufügen".
 *   Bug #3 (Wrong position): Upload button rendered before the document list, not after.
 *
 * These tests verify the fixes introduced in FieldDocumentZone.tsx, UploadOCR.tsx,
 * and the screen components (Screen2–Screen5) are not regressed.
 *
 * Tests run against wizard/4 (Strom) because it has two OCR-enabled fields (STROM,
 * FERNWAERME) with FieldDocumentZone + UploadOCR pairs, making it ideal for coverage.
 */

// ---------------------------------------------------------------------------
// Helper: A minimal FieldDocument fixture for route-mocking tests.
// ---------------------------------------------------------------------------
const MOCK_DOCUMENT = {
  id: 1,
  filePath: "/uploads/test-rechnung.pdf",
  originalFilename: "strom-rechnung-2024.pdf",
  mimeType: "application/pdf",
  uploadedAt: "2024-03-01T10:00:00Z",
  recognizedValue: 12500,
  billingMonth: null,
  isJahresabrechnung: false,
};

// ---------------------------------------------------------------------------
// Bug #2 regression — button label must be "Rechnung hinzufügen"
// ---------------------------------------------------------------------------
test.describe("Bug #2 regression — correct button label", () => {
  test("upload button shows 'Rechnung hinzufügen', not 'Rechnung hochladen'", async ({
    page,
  }) => {
    await page.goto("/wizard/4?year=2024");

    // At least one "📄 Rechnung hinzufügen" button must be visible (UploadOCR renders one
    // per OCR-enabled field: STROM and FERNWAERME → two buttons on Screen 4).
    const buttons = page.getByRole("button", { name: /Rechnung hinzufügen/i });
    await expect(buttons.first()).toBeVisible();

    // The old wrong label must not appear anywhere on the page.
    const oldLabel = page.getByRole("button", { name: /Rechnung hochladen/i });
    await expect(oldLabel).toHaveCount(0);
  });

  test("'Rechnung hochladen' text does not appear anywhere on screen 4", async ({
    page,
  }) => {
    await page.goto("/wizard/4?year=2024");
    const body = await page.content();
    // The old label must not appear anywhere — not even in hidden elements.
    expect(body).not.toContain("Rechnung hochladen");
  });
});

// ---------------------------------------------------------------------------
// Bug #1 regression — no duplicate button (empty state, no docs)
// ---------------------------------------------------------------------------
test.describe("Bug #1 regression — single upload button (empty state)", () => {
  test("screen 4 shows exactly two upload buttons in empty state (one per OCR field)", async ({
    page,
  }) => {
    await page.goto("/wizard/4?year=2024");

    // Screen 4 has exactly two OCR-enabled fields: STROM and FERNWAERME.
    // Each field should have exactly ONE upload button. The bug caused a second
    // "+ Beleg hinzufügen" button to appear once docs.length > 0, so the total
    // count would have doubled to four.
    const uploadButtons = page.getByRole("button", { name: /Rechnung hinzufügen/i });
    await expect(uploadButtons).toHaveCount(2);
  });

  test("screen 2 shows exactly one upload button per OCR field in empty state", async ({
    page,
  }) => {
    // Screen 2 (Heizung) has three OCR-enabled fields: ERDGAS, HEIZOEL, FLUESSIGGAS.
    await page.goto("/wizard/2?year=2024");
    const uploadButtons = page.getByRole("button", { name: /Rechnung hinzufügen/i });
    // Three OCR fields → three buttons. Pre-fix, after any upload, there would be a duplicate.
    const count = await uploadButtons.count();
    // At minimum there must be upload buttons and no more than one per OCR-enabled field.
    // Screen 2 has 3 OCR fields (Erdgas, Heizöl, Flüssiggas) → expect exactly 3.
    expect(count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Bug #1 regression — no duplicate button when documents exist (route-mocked)
// ---------------------------------------------------------------------------
test.describe("Bug #1 regression — single upload button with existing documents", () => {
  test("with existing docs, FieldDocumentZone does not add a second upload button", async ({
    page,
  }) => {
    // Mock /api/field-documents to return one document for STROM/2024.
    // This simulates the "after upload" state that triggered the duplicate-button bug.
    await page.route(/\/api\/field-documents\?fieldKey=STROM&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([MOCK_DOCUMENT]),
      });
    });

    // FERNWAERME zone stays empty (default API response returns []).
    await page.route(/\/api\/field-documents\?fieldKey=FERNWAERME&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/wizard/4?year=2024");

    // After the fix, FieldDocumentZone.showAddButton = !suppressInitialUpload && docs.length > 0.
    // Because suppressInitialUpload is true on Screen 4, showAddButton stays false even with
    // docs present. So the total upload button count must still be exactly 2 (one per OCR field).
    const uploadButtons = page.getByRole("button", { name: /Rechnung hinzufügen/i });
    await expect(uploadButtons).toHaveCount(2);

    // The secondary "+ Beleg hinzufügen" button from FieldDocumentZone must not appear.
    // Before the fix this text would appear as a second upload trigger.
    const addBelegButton = page.getByRole("button", { name: /Beleg hinzufügen/i });
    await expect(addBelegButton).toHaveCount(0);
  });

  test("FieldDocumentZone renders the uploaded document, not a duplicate button", async ({
    page,
  }) => {
    // Simulate STROM field having one uploaded document.
    await page.route(/\/api\/field-documents\?fieldKey=STROM&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([MOCK_DOCUMENT]),
      });
    });
    await page.route(/\/api\/field-documents\?fieldKey=FERNWAERME&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/wizard/4?year=2024");

    // The document filename should be visible in the document list.
    await expect(
      page.getByText("strom-rechnung-2024.pdf")
    ).toBeVisible();

    // The recognised value extracted by OCR should be visible.
    await expect(page.getByText(/Erkannter Wert/i)).toBeVisible();

    // Despite docs being present, there must be no extra "+ Beleg hinzufügen" button.
    const addBelegButton = page.getByRole("button", { name: /Beleg hinzufügen/i });
    await expect(addBelegButton).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Bug #3 regression — correct DOM order (document list before upload button)
// ---------------------------------------------------------------------------
test.describe("Bug #3 regression — document zone before upload button", () => {
  test("document zone (empty-state placeholder) appears before the upload button in DOM", async ({
    page,
  }) => {
    await page.goto("/wizard/4?year=2024");

    // Both elements must be present.
    await expect(page.getByText("Kein Dokument hochgeladen").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Rechnung hinzufügen/i }).first()
    ).toBeVisible();

    // Assert DOM order: the empty-state placeholder must appear BEFORE the upload button.
    // A positive compareDocumentPosition result bit 0x4 means "b follows a" (i.e., a before b).
    const isDocumentZoneBeforeButton = await page.evaluate(() => {
      const emptyState = document.querySelector(
        // The empty-state div contains the "Kein Dokument hochgeladen" text span
        '[aria-hidden="true"] + span'
      )?.closest("div");
      const uploadButton = Array.from(
        document.querySelectorAll("button")
      ).find((btn) => btn.textContent?.includes("Rechnung hinzufügen"));

      if (!emptyState || !uploadButton) return null;

      // Node.DOCUMENT_POSITION_FOLLOWING (0x4) means uploadButton comes after emptyState.
      return !!(emptyState.compareDocumentPosition(uploadButton) & Node.DOCUMENT_POSITION_FOLLOWING);
    });

    expect(isDocumentZoneBeforeButton).toBe(true);
  });

  test("with existing docs, document list appears before upload button in DOM", async ({
    page,
  }) => {
    // Simulate one document so the list renders (not the empty-state placeholder).
    await page.route(/\/api\/field-documents\?fieldKey=STROM&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([MOCK_DOCUMENT]),
      });
    });
    await page.route(/\/api\/field-documents\?fieldKey=FERNWAERME&year=2024/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/wizard/4?year=2024");

    // Wait for the mocked document to appear in the list.
    await expect(page.getByText("strom-rechnung-2024.pdf")).toBeVisible();

    // The document list item (containing the filename) must precede the upload button.
    const isDocumentListBeforeButton = await page.evaluate(() => {
      const docItem = Array.from(document.querySelectorAll("li")).find((li) =>
        li.textContent?.includes("strom-rechnung-2024.pdf")
      );
      const uploadButton = Array.from(document.querySelectorAll("button")).find(
        (btn) => btn.textContent?.includes("Rechnung hinzufügen")
      );

      if (!docItem || !uploadButton) return null;

      return !!(docItem.compareDocumentPosition(uploadButton) & Node.DOCUMENT_POSITION_FOLLOWING);
    });

    expect(isDocumentListBeforeButton).toBe(true);
  });
});
