# ADR-004: Document Count Limit — Hard Cap vs. Soft Warning

## Status

Accepted

## Context

With the removal of the `@@unique([fieldKey, year])` constraint (ADR-003) and the
introduction of append-only document storage, there is no longer any technical guard on
the number of documents a user can attach to a single emission category / year combination.

For most categories the expected document count is 1–13 (e.g., 12 monthly bills + 1
annual settlement for STROM). Runaway uploads (e.g., accidentally uploading hundreds of
files) would consume excessive disk space and degrade UI performance.

The spec states: "There is no hard upper limit imposed by the UI, though a soft warning
may be shown if more than ~20 documents are attached (to prevent accidental runaway
uploads)."

## Options Considered

### Option A: Soft UI warning only (chosen)

`FieldDocumentZone` renders a dismissible amber warning banner when `docs.length >= 20`:

> *"⚠ 20 Dokumente hochgeladen — bitte prüfen Sie, ob alle Belege korrekt sind."*

No server-side count check. No DB constraint. Upload continues to work normally above
the threshold.

- **Pros:**
  - Minimal implementation — a single conditional in the component.
  - No migration, no server-side logic change.
  - Appropriate for a single-tenant application where the operator and the user are
    the same person; a hard cap would feel patronising and could block legitimate
    workflows (e.g., a contractor with 24 monthly invoices from two providers).
  - Warning threshold (20) can be changed by modifying one constant.

- **Cons:**
  - No server-side protection against runaway uploads if the UI is bypassed
    (e.g., via direct API calls). In the target deployment (self-hosted, single-tenant,
    no public API), this risk is negligible.

### Option B: Hard cap enforced in the API (e.g., max 50 documents per fieldKey/year)

`POST /api/field-documents` counts existing records for the `(fieldKey, year)` and
returns `HTTP 422` if the count is at or above 50.

- **Pros:** Server-side protection; prevents disk exhaustion even if UI is bypassed.
- **Cons:** Adds a `COUNT` query to every upload; the hard limit of 50 is arbitrary and
  may be too low for some edge cases (e.g., weekly billing × 52 weeks); returning an
  error when the user legitimately has many invoices creates a bad UX; the check must
  also be added to the extended `/api/ocr` path.

### Option C: Database-level `CHECK` constraint

A PostgreSQL `CHECK` constraint via a DB trigger or a partial index ensuring a maximum
count per `(fieldKey, year)`.

- **Pros:** Enforceable at the database level regardless of API path.
- **Cons:** Cannot be expressed natively in Prisma schema (requires raw SQL migration);
  inconsistent with the project's Prisma-only convention; overly complex for a single-
  tenant application.

## Decision

**Option A — Soft UI warning at ≥ 20 documents, no hard cap.**

## Rationale

GrünBilanz is a single-tenant application; the user and the operator are the same
business. A hard cap would add friction to legitimate workflows (e.g., weekly billing)
and introduce server-side complexity disproportionate to the risk. A visible warning at
20 documents is sufficient to alert users of potential accidental uploads while allowing
deliberate high-volume document attachment.

The soft threshold (20) is a UI-level constant that can be increased without any schema
or API change.

## Consequences

### Positive

- Zero server-side complexity added for count enforcement.
- Legitimate workflows with > 20 documents per category remain supported.
- Warning threshold is easy to tune in future without a migration.

### Negative

- No server-side protection if the API is called directly (not via the UI). Acceptable
  given the single-tenant, self-hosted deployment model.

## Implementation Notes

For the Developer:

In `FieldDocumentZone`:

```tsx
const SOFT_LIMIT = 20;

// After rendering the document list:
{docs.length >= SOFT_LIMIT && (
  <p className="mt-2 text-xs text-amber-600">
    ⚠ {docs.length} Dokumente hochgeladen — bitte prüfen Sie, ob alle Belege korrekt sind.
  </p>
)}
```

Export `SOFT_LIMIT` as a named constant so it can be referenced in tests.

No changes required in `route.ts` files or the Prisma schema for this decision.
