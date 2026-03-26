# Bug Analysis: Invoice Upload UI & Sum Calculation Issues

**Feature:** `docs/features/001-company-settings-ui/`
**Branch:** `copilot/improve-company-settings-management`
**Date:** 2025-07-19
**Analyst:** Issue Analyst Agent

---

## Problem Summary

Three related issues remain unresolved after the initial Developer implementation:

1. **Inconsistent upload UI** — Screen 4 (Strom) still contains a "Monatliche Rechnungen verwenden" checkbox that should not exist.
2. **Missing per-invoice "Jahresabrechnung" checkbox** — The FieldDocumentZone shows uploaded documents but has no way to mark an invoice as an annual invoice, and no "Erkannter Wert" display.
3. **Invoice sum calculation** — When uploading multiple invoices, the recognized value currently *replaces* the field total instead of *incrementing* it. A "Jahresabrechnung" upload should replace, but a regular invoice should add to the running total.

---

## Bug 1: "Monatliche Rechnungen verwenden" Checkbox Exists in Screen 4

### Affected File
`src/components/wizard/screens/Screen4Strom.tsx`

### Exact Location

| Element | Lines | Description |
|---|---|---|
| `useMonthly` / `isFinalAnnual` form fields | schema ~L51–64 | Two boolean fields in the Zod schema that drive the monthly mode |
| `useMonthly` / `isFinalAnnual` `watch()` calls | ~L98–100 | Reactive values used to toggle monthly UI |
| `useMonthly` conditional in `useEffect` | ~L118–127 | Loads monthly entries on mount and restores monthly mode |
| Monthly save branch in `onSubmit` | ~L142–165 | Saves 12 individual monthly entries when `useMonthly && !isFinalAnnual` |
| Monthly billing toggle UI section | ~L185–224 | The entire `rounded-md border ... bg-gray-50` block containing the `Monatliche Rechnungen verwenden` checkbox |

### What Is Wrong

The expected UI from the maintainer shows **no** "Monatliche Rechnungen verwenden" checkbox anywhere. The per-invoice "Jahresabrechnung" checkbox (per-document in FieldDocumentZone) replaces the need for this screen-level toggle.

### Required Fix

Remove the following from `Screen4Strom.tsx`:
- `useMonthly` and `isFinalAnnual` from the Zod schema
- `useMonthly` and `isFinalAnnual` from `FormValues` type
- `MONTHLY_KEYS` constant and `monthlySchema`
- `useMonthly`, `isFinalAnnual` `watch()` calls
- Monthly data-loading branch inside `useEffect` (lines restoring `useMonthly` and `MONTHLY_KEYS`)
- The monthly save branch inside `onSubmit` (only keep the annual `saveEntry` call for Strom)
- The entire monthly billing toggle UI section (`<div className="rounded-md border border-gray-100 bg-gray-50 p-4 space-y-3">`)
- The `isFinalAnnual` label suffix on the Strom input (`{isFinalAnnual ? ' — Jahresendsumme' : ''}`)

After removing this, `Screen4Strom` becomes simpler: it saves a single annual Strom value, just like Heizung and Fuhrpark screens do.

---

## Bug 2: FieldDocumentZone Missing Per-Invoice Metadata UI

### Affected Files

| File | Issue |
|---|---|
| `src/components/wizard/FieldDocumentZone.tsx` | No "Erkannter Wert", no "Monat" dropdown, no "Jahresabrechnung" checkbox per document; button text is wrong |
| `src/app/api/field-documents/[id]/route.ts` | Has only `DELETE`; no `PATCH` to update per-doc metadata |
| `src/app/api/field-documents/route.ts` | POST and GET don't include `recognizedValue`, `billingMonth`, `isJahresabrechnung` |
| `src/app/api/ocr/route.ts` | Does not save `recognizedValue` to the `FieldDocument` record it creates |
| `prisma/schema.prisma` | `FieldDocument` model lacks `recognizedValue Float?`, `billingMonth Int?`, `isJahresabrechnung Boolean` |

### Expected UI Per Document (from Maintainer Spec)

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ 📄  rechnung-januar-2024.pdf                    [Entfernen]│
│      Erkannter Wert: 8500 m³                                 │
│      Monat: [── Kein Monat ▼]  □ Jahresabrechnung            │
└─────────────────────────────────────────────────────────────┘
│ + Beleg hinzufügen                                           │
```

### What Is Wrong

1. **`FieldDocument` Prisma model** — missing three columns:
   - `recognizedValue Float?` — the OCR-extracted numeric value (set at upload time via OCR API)
   - `billingMonth Int?` — 1–12 or null; lets the user tag which month the invoice covers
   - `isJahresabrechnung Boolean @default(false)` — marks the invoice as covering the full year

2. **`/api/ocr/route.ts`** — when creating a `FieldDocument` record (line where `prisma.fieldDocument.create` is called), `recognizedValue` from the OCR result (`result.value`) is not saved.

3. **`/api/field-documents/route.ts`** — POST (`prisma.fieldDocument.create`) and GET (`findMany`) do not include the new columns. The GET response needs `recognizedValue`, `billingMonth`, `isJahresabrechnung` so the UI can render them.

4. **`/api/field-documents/[id]/route.ts`** — only has `DELETE`. Needs a `PATCH` method to allow updating `billingMonth` and `isJahresabrechnung` when the user checks/unchecks the checkbox or changes the dropdown.

   PATCH body: `{ billingMonth?: number | null, isJahresabrechnung?: boolean }`
   Response: updated `FieldDocument` record.

5. **`FieldDocumentZone.tsx`** — document list items need:
   - "Erkannter Wert: X `unit`" label in green (if `recognizedValue != null`)
   - Month dropdown (options: "Kein Monat", Jan–Dez; calls PATCH when changed)
   - "Jahresabrechnung" checkbox (calls PATCH when toggled; triggers `onDocumentsChange` so parent can recalculate total)
   - Button text changed from "+ Weitere Rechnung hinzufügen" → **"+ Beleg hinzufügen"**
   - A new `onDocumentsChange?: (docs: FieldDocument[]) => void` callback prop

6. **`UploadOCR.tsx`** — when calling `onDocumentStored`, pass `recognizedValue` so the parent knows the OCR-extracted value for the newly stored FieldDocument. Update `StoredDocument` interface to include `recognizedValue?: number`.

### Required Prisma Migration

```sql
-- Migration: add invoice metadata columns to FieldDocument
ALTER TABLE "FieldDocument" ADD COLUMN "recognizedValue" DOUBLE PRECISION;
ALTER TABLE "FieldDocument" ADD COLUMN "billingMonth" INTEGER;
ALTER TABLE "FieldDocument" ADD COLUMN "isJahresabrechnung" BOOLEAN NOT NULL DEFAULT FALSE;
```

Migration file path: `prisma/migrations/20260326000000_fielddocument_invoice_metadata/migration.sql`

Also update `prisma/schema.prisma`:

```prisma
model FieldDocument {
  id                  Int      @id @default(autoincrement())
  fieldKey            String
  year                Int
  filePath            String
  originalFilename    String
  mimeType            String
  uploadedAt          DateTime @default(now())
  // OCR-extracted value stored at upload time (null if uploaded without OCR)
  recognizedValue     Float?
  // Which month (1–12) this invoice covers; null = unspecified
  billingMonth        Int?
  // True if this invoice covers the entire year (overrides monthly accumulation)
  isJahresabrechnung  Boolean  @default(false)
}
```

---

## Bug 3: Invoice Sum Calculation Is Replace Instead of Increment

### Affected Files

| File | Issue |
|---|---|
| `src/components/wizard/screens/Screen2Heizung.tsx` | `onResult` callbacks call `setValue('erdgas', v)` etc. — replaces instead of adds |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Same pattern for `diesel` and `benzin` |
| `src/components/wizard/screens/Screen4Strom.tsx` | Same for `strom` and `fernwaerme` |

### Exact Locations in Screen2Heizung.tsx

```tsx
// Line ~163 — BUG: replaces current value instead of incrementing
onResult={(v, _conf, docId) => { setValue('erdgas', v); setLastDocumentId(docId); }}

// Line ~183 — BUG: same for heizoel
onResult={(v, _conf, docId) => { setValue('heizoel', v); setLastDocumentId(docId); }}

// Line ~200 — BUG: same for fluessiggas  
onResult={(v, _conf, docId) => { setValue('fluessiggas', v); setLastDocumentId(docId); }}
```

### Required Behaviour

```
Upload Invoice A (regular):   field = 0 + 8500 = 8500
Upload Invoice B (regular):   field = 8500 + 8500 = 17000
Upload Invoice C (Jahresabrechnung): field = 9000  ← replaces
User unchecks Jahresabrechnung on C: field = 8500 + 8500 + 9000 = 26000  ← recalculated
```

### Required Fix (sum calculation approach)

The total should be derived from the FieldDocument list rather than managed independently. The recommended approach:

1. **FieldDocumentZone** gets a `onDocumentsChange?: (docs: FieldDocument[]) => void` prop.
2. It calls this callback whenever docs change (upload, remove, PATCH for Jahresabrechnung).
3. Parent screens define a helper `calculateTotal(docs)`:

```ts
function calculateTotal(docs: FieldDocument[]): number {
  const annualDocs = docs.filter(d => d.isJahresabrechnung && d.recognizedValue != null);
  if (annualDocs.length > 0) {
    // Use the last-uploaded Jahresabrechnung value
    return annualDocs[annualDocs.length - 1].recognizedValue!;
  }
  return docs.reduce((sum, d) => sum + (d.recognizedValue ?? 0), 0);
}
```

4. Each FieldDocumentZone for a field that has a numeric input gets `onDocumentsChange={(docs) => setValue('erdgas', calculateTotal(docs))}`.
5. The `UploadOCR.onResult` callback is simplified to just store `documentId` (the total is now driven by `onDocumentsChange` from FieldDocumentZone).

**Note on initial upload**: When a file is first uploaded via `UploadOCR`, the `onDocumentStored` callback fires, which increments `refreshKey`, which causes FieldDocumentZone to re-fetch documents, which triggers `onDocumentsChange` with the updated list (including the newly created doc with its `recognizedValue`). This chain handles the total recalculation automatically.

---

## Bug 4: OCR Stub — Simulated Value Must Be Stored Per Document

### Affected File
`src/app/api/ocr/route.ts`

### What Is Wrong
When the `/api/ocr` route creates a `FieldDocument` (lines ~60–80 of route.ts), it does **not** save the OCR-extracted `result.value` into the record. The `fieldDoc` is created without `recognizedValue`:

```ts
// CURRENT (missing recognizedValue):
const fieldDoc = await prisma.fieldDocument.create({
  data: {
    fieldKey: safeFieldKey,
    year: safeYear,
    filePath: relPath,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
  },
});

// REQUIRED (include recognizedValue):
const fieldDoc = await prisma.fieldDocument.create({
  data: {
    fieldKey: safeFieldKey,
    year: safeYear,
    filePath: relPath,
    originalFilename: file.name,
    mimeType: file.type || 'application/octet-stream',
    recognizedValue: result.value,   // ← add this
  },
});
```

The OCR stub in `src/lib/ocr/index.ts` already returns realistic simulated values (e.g., 8500 m³ for ERDGAS). The only gap is that these values are not persisted to `FieldDocument.recognizedValue`.

### Also: Return `recognizedValue` and `fieldDocument` in OCR response

The API response should include the full updated FieldDocument (with `recognizedValue`) so `UploadOCR` can pass it to the `onDocumentStored` callback:

```ts
return NextResponse.json({
  ...result,
  documentId: uploadedDoc.id,
  fieldDocumentId,
  fieldDocument: fieldDoc,   // ← include full doc object
});
```

And in `UploadOCR.tsx`, update the `StoredDocument` interface and callback:

```ts
interface StoredDocument {
  id: number;
  originalFilename: string;
  filePath: string;
  recognizedValue?: number;   // ← add
}
```

---

## Summary: All Files That Need Changes

| File | Change Type | What To Change |
|---|---|---|
| `prisma/schema.prisma` | Schema change | Add `recognizedValue Float?`, `billingMonth Int?`, `isJahresabrechnung Boolean @default(false)` to `FieldDocument` |
| `prisma/migrations/20260326000000_fielddocument_invoice_metadata/migration.sql` | New file | `ALTER TABLE` to add the three columns |
| `src/app/api/ocr/route.ts` | Enhancement | Save `result.value` as `recognizedValue` in `FieldDocument.create`; include full `fieldDocument` in response JSON |
| `src/app/api/field-documents/route.ts` | Enhancement | GET returns `recognizedValue`, `billingMonth`, `isJahresabrechnung`; POST body accepts optional `recognizedValue` |
| `src/app/api/field-documents/[id]/route.ts` | New endpoint | Add `PATCH` method to update `billingMonth` and/or `isJahresabrechnung` |
| `src/components/wizard/FieldDocumentZone.tsx` | Major change | Add `recognizedValue` display, `billingMonth` dropdown, `isJahresabrechnung` checkbox per doc; add `onDocumentsChange` prop; rename button to "+ Beleg hinzufügen"; call PATCH on checkbox/dropdown changes |
| `src/components/wizard/UploadOCR.tsx` | Minor change | Add `recognizedValue` to `StoredDocument`; read it from API response |
| `src/components/wizard/screens/Screen2Heizung.tsx` | Logic fix | Add `onDocumentsChange` → `calculateTotal` for ERDGAS, HEIZOEL, FLUESSIGGAS; simplify `onResult` to only store `documentId` |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Logic fix | Same pattern for DIESEL_FUHRPARK, BENZIN_FUHRPARK |
| `src/components/wizard/screens/Screen4Strom.tsx` | Major change | Remove monthly mode entirely (checkbox, schema fields, load/save logic); add `onDocumentsChange` → `calculateTotal` for STROM, FERNWAERME; simplify `onResult` |

---

## OCR Stub Simulation Notes

The OCR stub in `src/lib/ocr/index.ts` already works correctly:
- Returns realistic simulated values per category (e.g., `ERDGAS: 8500 m³`, `STROM: 45000 kWh`)
- Simulates 1–2 second processing delay
- Returns `{ value, unit, confidence: 0.87 }`

No changes to the stub itself are needed. The only gap is that the returned `value` is not persisted to `FieldDocument.recognizedValue` — fixed by Bug 4 above.

---

## Test Cases That Must Pass After Fix

- [ ] Screen 2 (Heizung): Upload 3 invoices for ERDGAS → total field shows sum of all three recognized values
- [ ] Screen 2 (Heizung): Upload 2 monthly invoices then 1 Jahresabrechnung → total field shows only the Jahresabrechnung value
- [ ] Screen 2 (Heizung): Uncheck Jahresabrechnung on the annual invoice → total field recalculates to sum of all recognized values
- [ ] Screen 4 (Strom): "Monatliche Rechnungen verwenden" checkbox does NOT appear
- [ ] FieldDocumentZone: Each uploaded document shows "Erkannter Wert: X unit" in green
- [ ] FieldDocumentZone: Each document has a "Monat" dropdown (optional, defaults to "Kein Monat")
- [ ] FieldDocumentZone: Each document has a "Jahresabrechnung" checkbox
- [ ] FieldDocumentZone: Add button reads "+ Beleg hinzufügen"
- [ ] PATCH /api/field-documents/[id]: updating `isJahresabrechnung` returns updated document
- [ ] OCR API: FieldDocument created via OCR includes `recognizedValue` matching the OCR stub output

---

## Related Code References

- Monthly mode schema/UI to remove: `Screen4Strom.tsx` lines ~40–65 (schema), ~98–100 (watch), ~118–127 (useEffect), ~142–165 (onSubmit), ~185–224 (UI section)
- FieldDocument Prisma model: `prisma/schema.prisma` ~L141–151
- OCR FieldDocument create call: `src/app/api/ocr/route.ts` ~L69–80
- UploadOCR `onResult` calls to fix: Screen2 ~L163, L183, L200; Screen3 ~L112; Screen4 ~L186, L196
