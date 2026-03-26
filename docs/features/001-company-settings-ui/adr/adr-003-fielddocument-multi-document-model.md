# ADR-003: FieldDocument Data Model — Multi-Document Support

## Status

Accepted

## Context

The current `FieldDocument` Prisma model enforces exactly one document per `(fieldKey, year)`
combination via a unique constraint:

```prisma
model FieldDocument {
  id               Int      @id @default(autoincrement())
  fieldKey         String
  year             Int
  filePath         String
  originalFilename String
  mimeType         String
  uploadedAt       DateTime @default(now())

  @@unique([fieldKey, year])
}
```

The API (`/api/field-documents`) uses `prisma.fieldDocument.upsert` with
`where: { fieldKey_year: { fieldKey, year } }`, meaning every new upload silently
replaces the previous document.

The spec requires users to attach multiple documents per `(fieldKey, year)` — for example,
12 monthly electricity bills plus one annual settlement invoice for the `STROM` category.

This requires removing the unique constraint and migrating the API to an append-based model.

## Options Considered

### Option A: Drop `@@unique([fieldKey, year])` (chosen)

Remove the unique composite index from the Prisma schema. Generate a new migration
(`prisma migrate dev`) that executes `DROP INDEX` on the existing constraint.

All existing `FieldDocument` rows are preserved unchanged — they become the first
document in each category's list. No data migration is required.

API changes:
- `GET /api/field-documents` returns `FieldDocument[]` (array) instead of a single record.
- `POST /api/field-documents` uses `prisma.fieldDocument.create` (no more upsert).
- New `DELETE /api/field-documents/[id]` endpoint removes a single document by ID
  (filesystem file + DB record).

Filename storage: since multiple files for the same `(fieldKey, year)` can now exist in
the same directory, filenames must be unique. Prepend a timestamp (Unix ms) to the
sanitised filename: `{timestamp}_{base}.{ext}`. This prevents collisions without
requiring a UUID library.

- **Pros:**
  - Minimal migration: one index removal, no row transformation.
  - API change is straightforward (array vs. single object).
  - Existing documents are preserved as-is.
  - Straightforward rollback: re-add the unique index (note: would fail if multiple
    documents exist for the same key/year by rollback time — acceptable given single-tenant
    context and dev/staging environments).

- **Cons:**
  - Removes a DB-level guard that previously prevented accidental duplicates.
    The new design intentionally allows multiple documents, so this is not a regression.

### Option B: New `FieldDocumentVersion` join model

Keep the current `FieldDocument` with its unique constraint as a "latest document"
pointer, and introduce a new `FieldDocumentVersion` table that stores the full list.

- **Pros:** Backward-compatible primary record; query for latest is still O(1).
- **Cons:** Unnecessary complexity — two tables for one concept; the spec does not require
  a "latest" concept; the client already needs to render the full list.

### Option C: JSONB array column

Store all documents for a `(fieldKey, year)` as a JSONB array in a single row.

- **Pros:** Single row per category.
- **Cons:** Violates Prisma/schema-first conventions; individual documents cannot be
  efficiently queried or deleted by ID; breaks the convention of using Prisma models
  for all DB access.

## Decision

**Option A — Drop `@@unique([fieldKey, year])`, use append-only `create`.**

## Rationale

The unique constraint was purely an artefact of the original one-document design; it has
no business-rule justification for the new requirements. Removing it is the minimal,
non-destructive change that unlocks multi-document support. Options B and C add
complexity without compensating benefits for a single-tenant application.

## Consequences

### Positive

- Existing data is preserved; no row-level migration needed.
- All `(fieldKey, year)` pairs become a flat list — simple to query, render, and delete.
- Individual document deletion by ID is trivially supported.
- Filename collision prevention via timestamp prefix is a simple, zero-dependency solution.

### Negative

- The `@@unique` guard is gone; the application must not re-introduce upsert logic.
  All future `POST /api/field-documents` calls must use `create`, not `upsert`.
- A unique index for `filePath` should optionally be added to prevent filesystem path
  collisions if two concurrent uploads write the same timestamp. A `nanoid`-based suffix
  can be used instead if timestamps prove insufficient under load (not a concern for the
  single-tenant target deployment but worth noting).

## Implementation Notes

For the Developer:

**Prisma schema (`schema.prisma`):**
```prisma
model FieldDocument {
  id               Int      @id @default(autoincrement())
  fieldKey         String
  year             Int
  filePath         String
  originalFilename String
  mimeType         String
  uploadedAt       DateTime @default(now())

  // @@unique([fieldKey, year])  ← REMOVED
}
```

Run `npx prisma migrate dev --name drop_fielddocument_unique` to generate the migration.

**Migration file** (auto-generated by Prisma, no manual SQL needed):
```sql
-- Drop the composite unique index
DROP INDEX "FieldDocument_fieldKey_year_key";
```

**`GET /api/field-documents`:**
```ts
// Change findUnique → findMany
const docs = await prisma.fieldDocument.findMany({
  where: { fieldKey, year: parseInt(year, 10) },
  orderBy: { uploadedAt: 'asc' },
});
return NextResponse.json(docs);  // always an array
```

**`POST /api/field-documents` (and the extended `/api/ocr` path):**
```ts
// Change upsert → create; prepend timestamp to filename
const timestamp = Date.now();
const filename = `${timestamp}_${base}.${ext}`;
const doc = await prisma.fieldDocument.create({
  data: { fieldKey, year: yearNum, filePath: relPath, originalFilename: file.name, mimeType: file.type },
});
```

**`DELETE /api/field-documents/[id]/route.ts` (new file):**
- Parse `id` from URL params.
- Fetch the record: `prisma.fieldDocument.findUniqueOrThrow({ where: { id } })`.
- Delete the physical file: `fs.unlink(path.join(process.cwd(), 'public', doc.filePath))`.
  Handle the case where the file does not exist (log and continue — do not fail).
- Delete the DB record: `prisma.fieldDocument.delete({ where: { id } })`.
- Return `204 No Content`.

**`FieldDocumentZone` component:**
- Change internal state from `doc: FieldDocument | null` to `docs: FieldDocument[]`.
- On mount, `GET /api/field-documents?fieldKey=...&year=...` returns an array.
- Render a document list: each item shows filename, "Ansehen" link, "Entfernen" button.
- "Entfernen" calls `DELETE /api/field-documents/{id}` then removes the item from
  local state (or re-fetches the list).
- Empty state (no documents) shows the dashed placeholder. Whether the "Rechnung
  hochladen" button is shown depends on `suppressInitialUpload` (see ADR-002).
- "Weitere Rechnung hinzufügen" button is shown when:
  - `suppressInitialUpload` is `true` (always show it, regardless of count), OR
  - `suppressInitialUpload` is `false` AND `docs.length > 0`.
- Soft-limit warning (see ADR-004) shown when `docs.length >= 20`.
