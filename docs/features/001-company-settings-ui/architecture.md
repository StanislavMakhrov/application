# Architecture: Company Settings Management, UI Simplification, and Invoice Flexibility

## Status

Accepted

## Overview

This document describes the technical architecture for feature `001-company-settings-ui`,
which makes three coordinated improvements to the GrünBilanz data-entry experience:

1. **Company profile centralisation** — moves Firmenprofil editing from wizard Screen 1
   to the "Einstellungen" page; Screen 1 becomes a read-only summary.
2. **Single upload action per field** — removes the duplicate "Rechnung hochladen"
   button that appears when both `UploadOCR` and `FieldDocumentZone` are rendered for
   the same field.
3. **Multiple invoices per category** — replaces the strict one-document-per-(fieldKey, year)
   limit with an append-based list.

Architecture decisions on the four open questions from the specification are documented
in individual ADRs:

| ADR | Question | Decision |
|-----|----------|----------|
| [ADR-001](adr/adr-001-screen1-readonly-vs-removal.md) | Screen 1: remove or read-only? | **Read-only summary with Settings link** |
| [ADR-002](adr/adr-002-upload-unification-strategy.md) | Upload unification strategy | **Extend `/api/ocr` with optional `fieldKey`/`year`** |
| [ADR-003](adr/adr-003-fielddocument-multi-document-model.md) | FieldDocument model migration | **Drop `@@unique([fieldKey, year])`; append-only** |
| [ADR-004](adr/adr-004-document-count-limit.md) | Hard vs soft document count limit | **Soft UI warning at ≥ 20, no hard cap** |

---

## Analysis

The existing architecture is sufficient for all three improvements. No new frameworks,
libraries, services, or architectural layers are required. All changes are incremental
extensions of the established patterns: Next.js App Router, Prisma, React client
components, and REST API routes under `/src/app/api/`.

---

## Implementation Guidance

### 1. Company Profile in Settings Page

**New component:** `src/components/settings/FirmenprofilSettings.tsx`

This is a client component (extract the form from `Screen1Firmenprofil.tsx`):
- Loads profile via `fetch('/api/entries?type=profile')`.
- Form with Zod/react-hook-form validation — identical to the current Screen 1 form.
- Calls `saveCompanyProfile` server action on submit; shows a success toast.
- Placed as a new `<section>` block inside `src/app/settings/page.tsx`, above the
  existing "Berichtsjahre" section (company identity is more prominent than year
  management).

**Existing `saveCompanyProfile` server action** (`src/lib/actions.ts`) requires no change;
it already writes to `CompanyProfile` with `id = 1` (global record).

**Screen 1 (`src/components/wizard/screens/Screen1Firmenprofil.tsx`):**
- Remove all form/edit elements (react-hook-form, Zod schema, `saveCompanyProfile` import,
  `<form>`, submit button).
- Retain the `fetch('/api/entries?type=profile')` call to load the current profile.
- Render each field as a labeled read-only row.
- Add an amber info callout: *"Firmenprofil-Daten können in den Einstellungen geändert
  werden."* with an `<a href="/settings">Einstellungen öffnen →</a>` link.
- If profile is empty (first-run), show: *"Firmendaten noch nicht hinterlegt — bitte
  in den Einstellungen erfassen."* with a Settings button.
- `WizardNav currentScreen={1}` stays; `totalScreens` remains 7.

### 2. Upload Unification (no duplicate buttons)

**Extended `/api/ocr` (`src/app/api/ocr/route.ts`):**
- Accept two new optional `FormData` fields: `fieldKey` (string) and `year` (string).
- After `uploadedDoc` creation and `extractFromFile`, if both are present:
  1. Write the file to `public/uploads/{year}/{fieldKey}/{timestamp}_{base}.{ext}`.
  2. `prisma.fieldDocument.create(...)` with the new file metadata.
  3. Include `fieldDocumentId` in the JSON response.
- Existing callers without `fieldKey`/`year` are unaffected.

**`UploadOCR` component (`src/components/wizard/UploadOCR.tsx`):**
- Add optional props:
  ```ts
  fieldKey?: string;
  year?: number;
  onDocumentStored?: (doc: { id: number; originalFilename: string; filePath: string }) => void;
  ```
- When `fieldKey` and `year` are provided, append them to `FormData`.
- On success, if `data.fieldDocumentId` is present, call `onDocumentStored`.

**`FieldDocumentZone` component (`src/components/wizard/FieldDocumentZone.tsx`):**
- Add props:
  ```ts
  suppressInitialUpload?: boolean;  // default false
  refreshKey?: number;              // increment to trigger re-fetch
  ```
- Change internal state from `doc: FieldDocument | null` to `docs: FieldDocument[]`.
- Update `useEffect` to re-fetch when `refreshKey` changes.
- API call changes from returning a single object to returning an array
  (`GET /api/field-documents` response changes to `FieldDocument[]`).
- "Rechnung hochladen" button in empty state is hidden when `suppressInitialUpload={true}`.
- "Weitere Rechnung hinzufügen" button:
  - Always visible when `suppressInitialUpload={true}`.
  - Visible when `suppressInitialUpload={false}` and `docs.length > 0`.
- Show soft-limit warning when `docs.length >= 20`.

**Screen components (Screen2, Screen3, Screen4, Screen5, Screen7):**

For every field that has both `<UploadOCR>` and `<FieldDocumentZone>`:
```tsx
const [refreshKey, setRefreshKey] = useState(0);

<UploadOCR
  category="STROM"
  fieldKey="STROM"
  year={year}
  onResult={(v, _conf, docId) => { setValue('strom', v); setLastDocumentId(docId); }}
  onDocumentStored={() => setRefreshKey((k) => k + 1)}
/>
// ...
<FieldDocumentZone
  fieldKey="STROM"
  year={year}
  suppressInitialUpload={true}
  refreshKey={refreshKey}
/>
```

For fields that have only `<FieldDocumentZone>` (Kältemittel, Abfall fields without OCR):
no change — `suppressInitialUpload` defaults to `false`.

### 3. FieldDocument Multi-Document API

**Prisma schema (`prisma/schema.prisma`):**
```prisma
model FieldDocument {
  id               Int      @id @default(autoincrement())
  fieldKey         String
  year             Int
  filePath         String
  originalFilename String
  mimeType         String
  uploadedAt       DateTime @default(now())
  // @@unique([fieldKey, year])  ← removed
}
```

Run `npx prisma migrate dev --name drop_fielddocument_unique`.

**`GET /api/field-documents/route.ts`:**
- `prisma.fieldDocument.findUnique` → `prisma.fieldDocument.findMany`
  with `orderBy: { uploadedAt: 'asc' }`.
- Response changes from `FieldDocument | null` to `FieldDocument[]`.

**`POST /api/field-documents/route.ts`:**
- `prisma.fieldDocument.upsert` → `prisma.fieldDocument.create`.
- Filename now includes a timestamp prefix: `${Date.now()}_${base}.${ext}`.

**`DELETE /api/field-documents/[id]/route.ts`** (new file):
```ts
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const doc = await prisma.fieldDocument.findUniqueOrThrow({ where: { id } });
  const fsPath = path.join(process.cwd(), 'public', doc.filePath);
  await unlink(fsPath).catch(() => {/* already deleted — log and continue */});
  await prisma.fieldDocument.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
```

---

## Components Affected

| File | Change type | Summary |
|------|-------------|---------|
| `prisma/schema.prisma` | Modify | Remove `@@unique([fieldKey, year])` from `FieldDocument` |
| `prisma/migrations/<ts>_drop_fielddocument_unique/` | New | Auto-generated migration |
| `src/app/settings/page.tsx` | Modify | Add "Firmenprofil" section; import `FirmenprofilSettings` |
| `src/components/settings/FirmenprofilSettings.tsx` | New | Full-featured company profile edit form (extracted from Screen 1) |
| `src/components/wizard/screens/Screen1Firmenprofil.tsx` | Modify | Replace edit form with read-only display + Settings link |
| `src/app/api/ocr/route.ts` | Modify | Accept optional `fieldKey`/`year`; create `FieldDocument` when provided |
| `src/app/api/field-documents/route.ts` | Modify | `findMany` (GET), `create` with timestamp prefix (POST) |
| `src/app/api/field-documents/[id]/route.ts` | New | `DELETE` single document by ID |
| `src/components/wizard/UploadOCR.tsx` | Modify | Add `fieldKey`, `year`, `onDocumentStored` optional props |
| `src/components/wizard/FieldDocumentZone.tsx` | Modify | Multi-doc list, `suppressInitialUpload`, `refreshKey`, soft limit warning |
| `src/components/wizard/screens/Screen2Heizung.tsx` | Modify | Wire unified upload for ERDGAS, HEIZOEL, FLUESSIGGAS |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Modify | Wire unified upload for fuel fields |
| `src/components/wizard/screens/Screen4Strom.tsx` | Modify | Wire unified upload for STROM, FERNWAERME |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx` | Modify | Wire unified upload for travel fields |
| `src/components/wizard/screens/Screen7Abfall.tsx` | Modify | Wire unified upload for waste fields that have UploadOCR |

---

## Security Considerations

- File upload paths continue to be sanitised (alphanumeric, hyphens, underscores only;
  single extension enforced) — this logic already exists in the field-documents route
  and must be replicated in the OCR route's new file-writing path.
- The `DELETE` endpoint operates by database ID only — no user-controlled path is used
  to locate the file (the path comes from the DB record, not the request).
- No authentication changes — existing single-tenant, no-auth model applies.

## Data Migration

The Prisma migration drops the unique index only. Existing `FieldDocument` rows are
preserved unchanged; they become the first (and only) entry in their respective lists.
The migration is safe to run against a production database without data loss.
