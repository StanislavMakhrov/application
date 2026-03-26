# Code Review: Company Settings Management, UI Simplification, and Invoice Flexibility

**Feature:** 001-company-settings-ui  
**Branch:** `copilot/improve-company-settings-management`  
**Reviewer:** Code Reviewer Agent  
**Date:** 2025-07-18  

---

## Summary

The implementation covers all three feature areas specified in the feature document:
company profile centralisation (FirmenprofilSettings + Screen 1 read-only), duplicate
upload-button removal (UploadOCR extended with fieldKey/year props + suppressInitialUpload),
and multiple-invoices support (FieldDocument unique constraint dropped, GET returns array,
DELETE endpoint added). The general approach matches the architecture document.

However, there are **5 Blocker issues** — including unresolved merge-conflict markers in
`docs/agents.md`, missing required work-protocol entries, missing global documentation
updates, and a **path traversal security vulnerability** — and 2 Major issues that must be
addressed before approval.

---

## Verification Results

- **Tests:** ✅ Pass — 13/13 (existing tests only; see Major Issues for missing new tests)
- **Build:** ✅ Clean — `next build` produces no TypeScript errors and no deprecation warnings
- **Docker:** Not verified (no running Docker daemon in this environment)
- **Merge conflicts:** ❌ `docs/agents.md` contains unresolved conflict markers

---

## Specification Compliance

| Acceptance Criterion | Implemented | Tested | Notes |
|---------------------|-------------|--------|-------|
| "Einstellungen" page contains a "Firmenprofil" section | ✅ | ❌ | FirmenprofilSettings added; no component test written |
| Saving Firmenprofil updates Dashboard/PDF Firmenname | ✅ | ❌ | Calls existing `saveCompanyProfile` action; no test |
| Screen 1 no longer allows editing company profile | ✅ | ❌ | Replaced with read-only summary + Settings link |
| No field shows two separate upload triggers | ✅ | ❌ | `suppressInitialUpload` prop suppresses FieldDocumentZone button |
| Single upload pre-fills value AND stores document evidence | ✅ | ❌ | OCR route now creates FieldDocument when fieldKey+year provided |
| User can attach more than one invoice per category | ✅ | ❌ | Unique constraint dropped; POST uses `create` |
| Each document listed with view and remove options | ✅ | ❌ | FieldDocumentZone shows list with Ansehen + Entfernen |
| Removing one document doesn't affect others | ✅ | ❌ | DELETE /api/field-documents/[id] targets by primary key |
| Empty state shows "Kein Dokument hochgeladen" placeholder | ✅ | ❌ | Present in FieldDocumentZone empty-state branch |
| All UI labels/messages in German | ✅ | ❌ | Consistently German throughout |

**Spec Deviations Found:** None — all acceptance criteria are implemented. However, no
tests exist for any of them (see Major Issues).

---

## Adversarial Testing

| Test Case | Result | Notes |
|-----------|--------|-------|
| Empty fieldKey | Not Tested | `/api/field-documents` returns 400 for missing params ✓ |
| Path-traversal via fieldKey | **FAIL** | `fieldKey=../../etc` used directly in `path.join` — files written outside uploads dir |
| Path-traversal via year string | **FAIL** | `year="2024/../secret"` bypasses parseInt but still used in `path.join` |
| Non-numeric year string | Not Tested | GET uses `parseInt(year, 10)` — NaN passed to Prisma would throw uncaught error |
| OCR upload without fieldKey | Pass | Falls back to existing behaviour; no FieldDocument created |
| OCR upload with fieldKey + year | Not Tested | FieldDocument creation is best-effort (failure is silently logged) |
| Delete non-existent document | Pass | Returns 404 ✓ |
| Delete with non-numeric id | Pass | Returns 400 ✓ |
| More than 20 documents | Not Tested | Soft-limit warning at SOFT_LIMIT=20 is rendered; no hard cap |
| refreshKey increment triggers re-fetch | Not Tested | Logic correct by inspection; no automated test |

---

## Review Decision

**Status: ⛔ Changes Requested**

Five Blocker issues must be resolved before this PR can be approved.

---

## Issues Found

### Blockers

#### B-1 — Unresolved merge-conflict markers in `docs/agents.md`

`docs/agents.md` contains 18+ unresolved conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
introduced in the feature commit. The file is invalid Markdown and will fail `markdownlint`
in PR Validation CI. This must be resolved to a clean, conflict-free file.

```
docs/agents.md:193:<<<<<<< HEAD
docs/agents.md:201:=======
docs/agents.md:203:>>>>>>> 9edd39e (docs: add test plan and UAT test plan ...)
```

**Fix:** Resolve all conflict markers in `docs/agents.md`. Accept the HEAD version (which
adds the UI/UX Designer agent nodes to the Mermaid diagram) as the correct content.

---

#### B-2 — Technical Writer agent missing from work-protocol.md

Per `docs/agents.md § Required Agents by Workflow Type`, **Technical Writer is required
for every feature workflow**. There is no Technical Writer entry in
`docs/features/001-company-settings-ui/work-protocol.md`. The Technical Writer must run
and log their entry before this review can be approved.

---

#### B-3 — Task Planner agent missing from work-protocol.md

Per `docs/agents.md § Required Agents by Workflow Type`, **Task Planner is required
for every feature workflow**. There is no Task Planner entry in
`docs/features/001-company-settings-ui/work-protocol.md`. The Task Planner must run
and log their entry (or the Maintainer must confirm the step was intentionally skipped).

---

#### B-4 — `docs/features.md` not updated

`docs/features.md` exists as the global feature index. The table contains zero rows —
this feature has not been registered. Per the commenting guidelines and agent workflow,
the Technical Writer is responsible for appending the row. This is blocked by B-2
(Technical Writer not run) but is called out explicitly as a required deliverable.

---

#### B-5 — Path traversal vulnerability: unsanitized `fieldKey` in `path.join`

**Files:** `src/app/api/field-documents/route.ts` (line 44), `src/app/api/ocr/route.ts` (line 61)

In both API routes, the `fieldKey` form parameter is used directly in `path.join` to
construct a filesystem directory path, with **no sanitization or allowlist check**:

```typescript
// field-documents/route.ts, line 44
const uploadPath = path.join(UPLOAD_DIR, year, fieldKey);

// ocr/route.ts, line 61
const uploadPath = path.join(UPLOAD_DIR, yearStr, fieldKey);
```

An attacker can send `fieldKey=../../public/injected` and cause files to be written
outside the intended `public/uploads/` directory — anywhere under `public/` and
potentially beyond. Because `public/` is served by Next.js, this could be used to
overwrite existing static assets or plant malicious files.

Additionally, `year` (the raw string from FormData) is used in path construction rather
than `String(yearNum)` (the parsed integer). A value such as `year="2024/../secret"`
passes `parseInt` (returns `2024`) but still causes directory traversal when used in
`path.join`.

**Fix:**
```typescript
// Validate year is a finite integer
const yearNum = parseInt(year, 10);
if (!Number.isFinite(yearNum)) {
  return NextResponse.json({ error: 'Ungültiges Jahr' }, { status: 400 });
}

// Validate fieldKey against allowed emission category names
const ALLOWED_FIELD_KEYS = new Set([
  'ERDGAS', 'HEIZOEL', 'FLUESSIGGAS', 'DIESEL_FUHRPARK', 'BENZIN_FUHRPARK',
  'PKW_BENZIN_KM', 'PKW_DIESEL_KM', 'TRANSPORTER_KM', 'LKW_KM', 'STROM',
  'FERNWAERME', 'R410A_KAELTEMITTEL', 'R32_KAELTEMITTEL', 'R134A_KAELTEMITTEL',
  'SONSTIGE_KAELTEMITTEL', /* ...other valid keys */
]);
if (!ALLOWED_FIELD_KEYS.has(fieldKey)) {
  return NextResponse.json({ error: 'Ungültiger fieldKey' }, { status: 400 });
}

const uploadPath = path.join(UPLOAD_DIR, String(yearNum), fieldKey);
```

Apply the same fix to both `field-documents/route.ts` and `ocr/route.ts`.

---

### Major Issues

#### M-1 — No tests implemented for any new components or API routes

The test plan (`docs/features/001-company-settings-ui/test-plan.md`) specifies 20 test
cases across unit, integration, and E2E layers. The testing strategy
(`docs/testing-strategy.md`) explicitly requires: unit tests for new UI components,
integration tests for each new API route, and an E2E test covering the primary use case.

**None of these tests exist.** The two existing test files (`emissions.test.ts`,
`factors.test.ts`) are unchanged from the pre-feature baseline. The Developer's claim
"13/13 passing" refers only to those pre-existing tests.

Missing tests include:
- Unit: `FirmenprofilSettings` form rendering and submit (TC-01–03)
- Unit: `Screen1Firmenprofil` read-only display and Settings link (TC-04–05)
- Unit: `FieldDocumentZone` multi-doc list, empty state, soft limit, remove (TC-06–11)
- Unit: `UploadOCR` with `fieldKey`/`year` props triggering `onDocumentStored` (TC-12)
- Integration: `GET /api/field-documents` returns array (TC-13)
- Integration: `POST /api/field-documents` appends record (TC-14)
- Integration: `DELETE /api/field-documents/[id]` removes file and DB record (TC-15–16)
- Integration: `POST /api/ocr` with fieldKey+year creates FieldDocument (TC-17–18)
- E2E: Full Firmenprofil → Settings → Dashboard update flow

**Fix:** Implement the test cases defined in `test-plan.md`. At minimum, the integration
tests for the three modified/new API routes and the FieldDocumentZone component tests
should be added before merge.

---

#### M-2 — `year` string (not integer) used in `path.join` in both upload routes

Already covered as part of B-5 but worth noting separately as a standalone correctness
issue: `String(yearNum)` should replace the raw `year` string in all `path.join` calls.
The current code would create directories with the literal form-field string value,
which could be anything — including an empty string (`path.join(…, '', fieldKey)` would
silently collapse to just the `fieldKey` level).

---

### Minor Issues

#### m-1 — No user feedback when document removal fails

`FieldDocumentZone.handleRemove` catches DELETE failures silently:

```typescript
const handleRemove = async (id: number) => {
  setRemovingId(id);
  try {
    const res = await fetch(`/api/field-documents/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setDocs((prev) => prev.filter((d) => d.id !== id));
    }
    // ← no else branch: failed DELETE gives the user no feedback
  } finally {
    setRemovingId(null);
  }
};
```

If the DELETE returns 500 or the network fails, the document stays in the list but no
error message is shown. Add an `else` branch that sets `uploadError` (or shows a toast).

---

#### m-2 — `onDocumentStored` receives empty `filePath`

In `UploadOCR.tsx` (line 80–83):

```typescript
onDocumentStored({
  id: data.fieldDocumentId as number,
  originalFilename: file.name,
  filePath: data.filePath as string ?? '',  // data.filePath is always undefined
});
```

The OCR route response does not include `filePath`, so `data.filePath` is `undefined`
and the fallback `''` is passed. The parent callbacks in all three wizard screens ignore
the `StoredDocument` argument entirely (they just increment `refreshKey`), so this is
harmless at runtime — but it makes the `StoredDocument` interface misleading and would
break any future code that consumes `filePath` from this callback.

**Fix:** Either include `filePath` in the OCR route response, or remove it from the
`StoredDocument` interface if callers never need it.

---

#### m-3 — "Weitere Rechnung hinzufügen" shown with zero documents when suppressInitialUpload=true

When `suppressInitialUpload=true` and the document list is empty, `showAddButton` is
`true` (`suppressInitialUpload || docs.length > 0`), so the button is visible alongside
the "Kein Dokument hochgeladen" empty state. The label "Weitere Rechnung hinzufügen"
("Add another invoice") implies there are already invoices, which is confusing when the
list is empty. Consider changing the label to "Rechnung hinzufügen" for the zero-document
case, or using a conditional label.

---

### Suggestions

#### S-1 — Add `isNaN` guard in `GET /api/field-documents` for year

```typescript
// Current
const docs = await prisma.fieldDocument.findMany({
  where: { fieldKey, year: parseInt(year, 10) },  // NaN if year is non-numeric → Prisma throws
```

Add `const yearNum = parseInt(year, 10); if (isNaN(yearNum)) return 400;` before the
Prisma call to prevent an unhandled exception reaching the error boundary.

---

#### S-2 — Prevent concurrent removes in FieldDocumentZone

Rapidly clicking "Entfernen" on multiple documents fires multiple DELETE requests in
parallel. Consider setting `removingId` as a `Set<number>` and disabling all remove
buttons while any removal is in flight, or use an `isRemoving` boolean guard.

---

#### S-3 — Export `SOFT_LIMIT` from FieldDocumentZone for testability

The `SOFT_LIMIT = 20` constant is module-private, which makes unit-testing the warning
behaviour brittle (test must render 20+ documents). Exporting it as a named constant
would allow tests to use `SOFT_LIMIT` directly.

---

## Work Protocol & Documentation Verification

| Check | Status | Notes |
|-------|--------|-------|
| `work-protocol.md` exists | ✅ | Present at `docs/features/001-company-settings-ui/work-protocol.md` |
| Requirements Engineer logged | ✅ | Entry present |
| Architect logged | ✅ | Entry present |
| Quality Engineer logged | ✅ | Entry present |
| Task Planner logged | ❌ | **Missing** (Blocker B-3) |
| Developer logged | ✅ | Entry present |
| Technical Writer logged | ❌ | **Missing** (Blocker B-2) |
| Code Reviewer logged | ➡️ | This review |
| `docs/features.md` updated | ❌ | **Not updated** (Blocker B-4) |
| `docs/architecture.md` updated | ✅ | No global architectural changes; feature-local `architecture.md` present |
| `docs/testing-strategy.md` updated | ✅ | No new test patterns introduced |
| `docs/agents.md` clean | ❌ | **Merge conflict markers** (Blocker B-1) |

---

## Critical Questions Answered

- **What could make this code fail?**
  Path traversal input to `fieldKey` or `year` in upload endpoints could write files
  outside the intended uploads directory. Non-numeric `year` in GET/POST field-documents
  could cause an unhandled Prisma error. Document removal failures are silent.

- **What edge cases might not be handled?**
  Concurrent removal of multiple documents (no guard). OCR failure after FieldDocument
  is written to disk (file orphaned on filesystem, no DB record). Zero-length fieldKey
  or year in GET (would return 400 but yearNum=NaN flows into findMany in current code).

- **Are all error paths tested?**
  No. There are no automated tests for any of the new code paths, success or failure.

---

## Checklist Summary

| Category | Status |
|----------|--------|
| Correctness (spec compliance) | ✅ |
| Security | ❌ (B-5: path traversal) |
| Spec Compliance | ✅ |
| Code Quality | ⚠️ (minor issues m-1, m-2, m-3) |
| Architecture | ✅ |
| Testing | ❌ (M-1: no tests for new code) |
| Documentation | ❌ (B-1, B-2, B-3, B-4) |

---

## Next Steps

**This PR requires rework.** Recommend invoking the **Developer** agent to:

1. Fix the path traversal vulnerability in `field-documents/route.ts` and `ocr/route.ts`
   (B-5 / M-2) — validate `fieldKey` against an allowlist and use `String(yearNum)` in
   `path.join`.
2. Add error feedback for failed document removal in `FieldDocumentZone` (m-1).
3. Fix the `filePath` field in `onDocumentStored` callback or remove it from the interface
   (m-2).
4. Implement the missing tests from `test-plan.md` (M-1).

Then the **Technical Writer** agent must run to:
- Log their entry in `work-protocol.md`.
- Add this feature to `docs/features.md`.

And the **merge-conflict markers in `docs/agents.md`** (B-1) must be resolved — this can
be done by the Developer agent or directly by the Maintainer.

Once all Blocker and Major issues are resolved, return to Code Reviewer for re-approval.
