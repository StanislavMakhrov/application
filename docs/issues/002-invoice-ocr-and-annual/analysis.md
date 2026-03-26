# Issue Analysis: Invoice OCR Stub & Annual Invoice Selection Bugs

**Issue number:** 002  
**Branch:** `copilot/improve-company-settings-management`  
**Date:** 2026-03-26

---

## Summary

Two related bugs affect the invoice-upload + OCR flow in the GrünBilanz wizard:

| # | Bug | Root Cause |
|---|-----|------------|
| 1 | **OCR stub doesn't fill form values on invoice upload** | `UploadOCR` component removed from all wizard screens; uploads go to `/api/field-documents` (no OCR) |
| 2 | **Only one uploaded invoice can be marked as "annual"** | `calculateTotal` filters annual docs by `recognizedValue != null`, so annual marking has no effect when documents have no OCR-extracted value |

Both bugs stem from commit `425860a` ("fix: remove duplicate UploadOCR buttons alongside FieldDocumentZone") which stripped the `UploadOCR` component from wizard screens to eliminate a duplicate-button UI regression—but in doing so broke the OCR feature entirely. Bug 2 is a direct downstream consequence of Bug 1.

---

## Problem Description

### Bug 1 — OCR Values Not Auto-Filled

When a user uploads an invoice via the `FieldDocumentZone` upload button, the wizard form field (e.g. Erdgas m³, Strom kWh) is NOT auto-populated with the extracted value. Users must manually re-enter the consumption figure even after uploading the supporting invoice.

### Bug 2 — "Jahresabrechnung" Selection Has No Effect

When a user marks an uploaded invoice as the annual invoice (Jahresabrechnung checkbox in `FieldDocumentZone`), the form field is NOT updated to the annual value. The checkbox visually toggles (with proper mutual exclusion), but `calculateTotal` silently ignores the annual flag because all uploaded documents have `recognizedValue = null`. This makes it appear as though "only one invoice supports the annual choice" — in practice, none do, because no document ever carries an OCR-extracted value.

---

## Steps to Reproduce

### Bug 1
1. Navigate to `/wizard/2?year=2024` (Heizung screen).
2. Click **"Rechnung hochladen"** in the Erdgas `FieldDocumentZone`.
3. Upload any PDF or image file.
4. Observe: the Erdgas form field is **not** populated; the file is stored but `recognizedValue` is `null`.
5. `onDocumentsChange` fires with a doc list where every `recognizedValue` is `null`.
6. `calculateTotal` computes `0` → `setValue('erdgas', 0)` overwrites any previously typed value.

### Bug 2
1. Navigate to `/wizard/4?year=2024` (Strom screen).
2. Upload two invoice files (both end up with `recognizedValue = null`).
3. Check **"Jahresabrechnung"** on one of the documents.
4. Observe: the Strom form field is **not** updated; the checkbox state changes, but the total stays at `0`.
5. Uncheck that document and check the other — same result: no change to the form value.

---

## Expected Behavior

### Bug 1
After uploading an invoice, the wizard form field should be auto-populated with the OCR-extracted value (e.g. `45000 kWh` for STROM). A toast message "Erkannt: 45000 kWh (Konfidenz: 87%)" should appear.

### Bug 2
When a document is marked as Jahresabrechnung, the form field should reflect that document's extracted value and the value should replace (not sum) the monthly totals.

---

## Root Cause Analysis

### Affected Components

| File | Role |
|------|------|
| `src/components/wizard/UploadOCR.tsx` | OCR upload button — calls `/api/ocr`, fills `onResult`, creates `FieldDocument` via `/api/ocr` with `recognizedValue` set |
| `src/components/wizard/FieldDocumentZone.tsx` | Document attachment zone — built-in upload button calls `/api/field-documents` (no OCR), `recognizedValue` always `null` |
| `src/components/wizard/screens/Screen2Heizung.tsx#L52-L57` | `calculateTotal` helper requiring `recognizedValue != null` for annual docs |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx#L49-L54` | Same `calculateTotal` pattern |
| `src/components/wizard/screens/Screen4Strom.tsx#L47-L55` | Same `calculateTotal` pattern |
| `src/app/api/ocr/route.ts` | `/api/ocr` — calls `extractFromFile`, persists `UploadedDocument` + `FieldDocument` with `recognizedValue` |
| `src/app/api/field-documents/route.ts` | `/api/field-documents` POST — creates `FieldDocument` WITHOUT OCR, `recognizedValue` is never set |
| `src/lib/ocr/index.ts` | OCR stub — `extractFromFile()` returns stub values per category |

### Bug 1 — Root Cause: `UploadOCR` Removed from All Wizard Screens

The `UploadOCR` component was designed to:
1. Accept `fieldKey` + `year` props
2. POST to `/api/ocr` which calls `extractFromFile()` (the stub) and creates a `FieldDocument` with `recognizedValue` set
3. Call `onResult(value, confidence, documentId)` so the parent screen calls `setValue(fieldName, value)`
4. Call `onDocumentStored(doc)` to trigger `FieldDocumentZone`'s `refreshKey` increment

Commit `425860a` ("fix: remove duplicate UploadOCR buttons alongside FieldDocumentZone", branch `copilot/improve-company-settings-management`) removed all `UploadOCR` instances from Screen2, Screen3, and Screen4 (the three screens that had them). The stated reason was a duplicate-button regression: `FieldDocumentZone.showAddButton` was `suppressInitialUpload || docs.length > 0`, which is `true || false = true` when `suppressInitialUpload=true` (passed whenever `UploadOCR` was present), causing the `+ Beleg hinzufügen` button to appear in the empty state alongside the `UploadOCR` button.

**The root fix was applied incorrectly.** Removing `UploadOCR` eliminated the duplicate-button UI bug but silently broke the entire OCR pipeline. The correct fix would have been to adjust the `showAddButton` logic in `FieldDocumentZone`.

> 🔍 **How to verify**: Run `git show 425860a -- src/components/wizard/screens/Screen2Heizung.tsx` to see the original `UploadOCR` usage that was removed.

Current (broken) `showAddButton` logic:
```ts
// FieldDocumentZone.tsx – line visible in component body
const showAddButton = suppressInitialUpload || docs.length > 0;
// With suppressInitialUpload=true → always true → "+ Beleg hinzufügen" appears even in empty state
```

Correct fix for `showAddButton`:
```ts
const showAddButton = docs.length > 0;
// Only show the "+ Beleg hinzufügen" button once at least one document exists.
// The empty-state area already renders a separate upload button when !suppressInitialUpload.
```

### Bug 2 — Root Cause: `calculateTotal` Requires `recognizedValue != null` for Annual Docs

Every `calculateTotal` helper (duplicated in Screen2, Screen3, Screen4) contains:

```ts
function calculateTotal(docs: FieldDocument[]): number {
  const annualDocs = docs.filter((d) => d.isJahresabrechnung && d.recognizedValue != null);
  //                                                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                                   If recognizedValue is null, the annual flag is IGNORED
  if (annualDocs.length > 0) {
    return annualDocs[annualDocs.length - 1].recognizedValue!;
  }
  return docs.reduce((sum, d) => sum + (d.recognizedValue ?? 0), 0);
}
```

Because `UploadOCR` is absent, `recognizedValue` is `null` for every document (all uploads go through `/api/field-documents` which never populates `recognizedValue`). The `annualDocs` array is therefore always empty, so:
- The annual-invoice override branch is never reached
- The fallback `reduce` returns `0` (all `recognizedValue ?? 0 = 0`)
- `setValue(field, 0)` always fires — overwriting whatever value was typed

Even if Bug 1 is fixed, the filter `d.isJahresabrechnung && d.recognizedValue != null` still makes the annual feature silently no-op for any document uploaded via `FieldDocumentZone`'s own `+ Beleg hinzufügen` button (which calls `/api/field-documents` and never sets `recognizedValue`).

### Why `isJahresabrechnung` Mutual Exclusion Is NOT a Root Cause

The mutual-exclusion logic added in commit `dfde92b` (`handleJahresabrechnungChange` in `FieldDocumentZone.tsx`) is architecturally correct. Switching which document is the annual one works as intended at the UI and API level. The "only one invoice supports this choice" symptom is entirely caused by Bug 1/2 above, not by the mutual exclusion itself.

---

## Suggested Fix Approach

### Fix 1 — Restore `UploadOCR` in Wizard Screens + Fix `showAddButton`

**Step 1:** Fix `showAddButton` in `FieldDocumentZone.tsx`:

```diff
- const showAddButton = suppressInitialUpload || docs.length > 0;
+ const showAddButton = docs.length > 0;
```

This eliminates the duplicate-button regression without removing `UploadOCR`.

**Step 2:** Re-add `UploadOCR` to Screen2Heizung, Screen3Fuhrpark, Screen4Strom (and optionally Screen5, Screen6).

For each OCR-capable field, the pattern is:

```tsx
// 1. State in screen component
const [erdgasRefreshKey, setErdgasRefreshKey] = useState(0);

// 2. In JSX, alongside the field input
<UploadOCR
  category="ERDGAS"
  fieldKey="ERDGAS"
  year={year}
  onResult={(value, _confidence) => setValue('erdgas', value)}
  onDocumentStored={() => setErdgasRefreshKey((k) => k + 1)}
/>
<FieldDocumentZone
  fieldKey="ERDGAS"
  year={year}
  suppressInitialUpload   // hides the "Rechnung hochladen" button in empty state
  refreshKey={erdgasRefreshKey}
  onDocumentsChange={(docs) => setValue('erdgas', calculateTotal(docs))}
/>
```

Screens and fields requiring `UploadOCR`:

| Screen | Field key(s) |
|--------|-------------|
| `Screen2Heizung` | `ERDGAS`, `HEIZOEL`, `FLUESSIGGAS` |
| `Screen3Fuhrpark` | `DIESEL_FUHRPARK`, `BENZIN_FUHRPARK` |
| `Screen4Strom` | `STROM`, `FERNWAERME` |
| `Screen5Dienstreisen` | `GESCHAEFTSREISEN_FLUG`, `GESCHAEFTSREISEN_BAHN` |
| `Screen6Materialien` | `KUPFER` |

### Fix 2 — Fix `calculateTotal` Annual-Doc Filtering

Change the annual-doc filter to not require a non-null `recognizedValue`:

```ts
function calculateTotal(docs: FieldDocument[]): number {
  const annualDocs = docs.filter((d) => d.isJahresabrechnung);
  if (annualDocs.length > 0) {
    const lastAnnual = annualDocs[annualDocs.length - 1];
    // If the annual doc has no OCR value, fall through to the summing logic
    // so the user's manually-typed value is not erased.
    if (lastAnnual.recognizedValue != null) {
      return lastAnnual.recognizedValue;
    }
  }
  return docs.reduce((sum, d) => sum + (d.recognizedValue ?? 0), 0);
}
```

This change means:
- **Document with OCR value marked annual** → form field = OCR value (correct override)
- **Document without OCR value marked annual** → form falls back to sum of other docs' values (preserves any manually-entered value instead of zeroing the field)

The same fix must be applied in all three screens (Screen2, Screen3, Screen4).

---

## Affected Files

| File | Change Needed |
|------|---------------|
| `src/components/wizard/FieldDocumentZone.tsx` | Fix `showAddButton = docs.length > 0` |
| `src/components/wizard/screens/Screen2Heizung.tsx` | Re-add `UploadOCR` for ERDGAS/HEIZOEL/FLUESSIGGAS; fix `calculateTotal` |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Re-add `UploadOCR` for DIESEL_FUHRPARK/BENZIN_FUHRPARK; fix `calculateTotal` |
| `src/components/wizard/screens/Screen4Strom.tsx` | Re-add `UploadOCR` for STROM/FERNWAERME; fix `calculateTotal` |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx` | Re-add `UploadOCR` for FLUG/BAHN fields (if applicable) |
| `src/components/wizard/screens/Screen6Materialien.tsx` | Re-add `UploadOCR` for KUPFER (if applicable) |

---

## Test Gaps Identified

### Missing Unit Tests

- No unit tests for `calculateTotal` helper function (annual override logic, sum fallback, null-value handling)
- No unit test for `FieldDocumentZone.showAddButton` logic

### Missing Integration / E2E Tests

- No e2e test for OCR upload flow: upload file → OCR result → form field auto-populated
- No e2e test for `Jahresabrechnung` checkbox: mark doc as annual → form field updates to annual value
- No e2e test for annual mutual-exclusion: check doc2 after doc1 is annual → doc1 unchecked
- No e2e test for `FieldDocumentZone` duplicate-button regression (was hidden when UploadOCR removed)

### Related Tests That Must Pass After the Fix

- [ ] Upload via `UploadOCR` → form field populated with OCR stub value
- [ ] Marking a document as Jahresabrechnung (with OCR value) → form field = OCR value
- [ ] Marking a document as Jahresabrechnung (no OCR value) → form field not zeroed out
- [ ] Marking doc2 annual after doc1 is annual → doc1 unchecked (mutual exclusion)
- [ ] Single upload button visible in empty state (no duplicate)
- [ ] `+ Beleg hinzufügen` appears after first document is uploaded

---

## Additional Context

### Commit History

- **`425860a`** — "fix: remove duplicate UploadOCR buttons alongside FieldDocumentZone"  
  Introduced Bug 1 (removed `UploadOCR` from all screens). `showAddButton` regression was the stated justification.

- **`dfde92b`** — "fix: make Jahresabrechnung mutually exclusive per field zone"  
  Added `handleJahresabrechnungChange` mutual-exclusion logic. Correct implementation, but exposes Bug 2 more visibly because switching the annual doc still shows no change in the form field (since `recognizedValue` is always null).

### Schema / API

- `FieldDocument.recognizedValue` (`Float?`, nullable) — set only when a document is processed through `/api/ocr`. Always `null` when uploaded via `/api/field-documents` POST.
- `FieldDocument.isJahresabrechnung` (`Boolean`, default `false`) — server-level uniqueness is NOT enforced; mutual exclusion is UI-only.
- Migration `20260325000000_drop_fielddocument_unique` removed the unique index on `(fieldKey, year)`, enabling multiple docs per field/year.
- Migration `20260326000000_fielddocument_invoice_metadata` added `recognizedValue`, `billingMonth`, `isJahresabrechnung` columns.

### OCR Stub

`src/lib/ocr/index.ts` → `extractFromFile()` has stub values for 9 categories (STROM, ERDGAS, DIESEL_FUHRPARK, HEIZOEL, FLUESSIGGAS, FERNWAERME, GESCHAEFTSREISEN_FLUG, GESCHAEFTSREISEN_BAHN, KUPFER). All other categories fall back to `{ value: 1000, unit: 'Einheit' }`. The stub simulates 1–2 s latency. The TODO comment indicates this will eventually call a Tesseract microservice.

### Known Script Bug

`scripts/next-issue-number.sh` emits `[: : integer expression expected` and returns `001` even when `docs/features/001-*` already exists. Issue number `002` was used manually for this analysis. The script bug should be tracked and fixed separately to prevent future numbering conflicts.
