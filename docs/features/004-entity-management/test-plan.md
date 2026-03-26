# Test Plan: Entity Management (Feature 004)

## Overview

This test plan covers the CRUD management UI for `EmissionFactor` and
`IndustryBenchmark` entities introduced in Feature 004. It maps every
acceptance criterion from `analysis.md` to one or more automated test cases and
defines the E2E UAT scenario for manual Maintainer review.

Reference documents:
- Specification: `docs/features/004-entity-management/analysis.md`
- Architecture: `docs/features/004-entity-management/architecture.md`

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| **AC-1** `PUT /api/factors/:id` updates `factorKg`, `unit`, `source` | TC-01, TC-02, TC-03, TC-04 | Integration |
| **AC-2** `POST /api/factors` creates new row; 409 on duplicate `(key, validYear)` | TC-05, TC-06, TC-07, TC-08 | Integration |
| **AC-3** `GET /api/benchmarks` returns all rows | TC-09, TC-10 | Integration |
| **AC-4** `PUT /api/benchmarks/:id` updates `co2ePerEmployeePerYear` | TC-11, TC-12, TC-13 | Integration |
| **AC-5** Settings page shows inline-edit affordance for emission factors | TC-19, TC-20, TC-21 | Component |
| **AC-6** Settings page shows inline-edit affordance for benchmarks | TC-25, TC-26, TC-27 | Component |
| **AC-7** German-locale validation + success toast on update | TC-03, TC-12, TC-20, TC-26 | Integration + Component |
| **AC-8** `validYear` on `IndustryBenchmark`; `POST /api/benchmarks` | TC-14, TC-15, TC-16 | Integration |
| **AC-9** `DELETE /api/factors/:id` removes row | TC-17, TC-18 | Integration |

---

## User Acceptance Scenarios

> **Purpose**: For manual Maintainer review in the running app before merge.
> See `uat-test-plan.md` for the full interactive walkthrough.

### Scenario 1: Edit an Emission Factor

**User Goal**: Update a factor's `factorKg` from the Settings page and verify
the changed value is reflected in the wizard's factor hints.

**Test Steps**:
1. `cd src && npm run dev` (or use Docker image)
2. Navigate to `/settings` → scroll to *Emissionsfaktoren* section
3. Click the pencil icon on any factor row (e.g. *Erdgas*)
4. Change the numeric value and click **Speichern**
5. Verify that a `'Gespeichert.'` toast appears

**Expected Output**:
- Toast appears immediately after save
- Table row shows new value without page reload
- Navigating to the CO₂e wizard shows the updated factor hint

**Success Criteria**:
- [ ] Edit icon is visible for every row
- [ ] Only one row is editable at a time
- [ ] `PUT /api/factors/:id` is called with correct body
- [ ] Optimistic UI reflects the saved value

---

### Scenario 2: Add a New Emission Factor

**User Goal**: Add a new factor row for a new reporting year without touching
the database.

**Test Steps**:
1. Navigate to `/settings` → *Emissionsfaktoren*
2. Click **+ Neuer Faktor**
3. Fill in key, year, value, unit, source, scope
4. Click **Hinzufügen**
5. Verify the new row appears in the table

**Expected Output**:
- New row immediately visible in the table
- `POST /api/factors` is called
- Attempting to add the same `(key, year)` combination again shows a
  `'Dieser Faktor existiert bereits für dieses Jahr.'` toast

**Success Criteria**:
- [ ] Add form is rendered at the bottom of the table
- [ ] 409 conflict is handled gracefully
- [ ] Cancel reverts without API call

---

### Scenario 3: Delete an Emission Factor

**User Goal**: Remove an outdated or erroneous factor row.

**Test Steps**:
1. Navigate to `/settings` → *Emissionsfaktoren*
2. Click the trash icon on any row
3. Confirm the action in the toast/confirmation prompt
4. Verify row disappears

**Expected Output**:
- `DELETE /api/factors/:id` called
- Toast `'Faktor gelöscht.'` appears
- Row removed without page reload

---

### Scenario 4: Edit an Industry Benchmark

**User Goal**: Update a benchmark value for a specific trade category and year.

**Test Steps**:
1. Navigate to `/settings` → *Branchenvergleich*
2. Click the pencil icon on any benchmark row (e.g. *Baugewerbe*)
3. Change the value and save
4. Verify the dashboard *BranchenvergleichCard* reflects the updated value

**Success Criteria**:
- [ ] `PUT /api/benchmarks/:id` is called
- [ ] Toast `'Gespeichert.'` appears
- [ ] Dashboard reflects updated benchmark on next load

---

## Test Cases

### TC-01: PUT /api/factors/[id] — valid payload updates record

**Type:** Integration

**Description:**
`PUT /api/factors/[id]` with a valid body updates `factorKg`, `unit`, and
`source` in the database and returns 200 with the updated record.

**Preconditions:**
- Prisma `emissionFactor.findUnique` mock returns a factor row for the given id
- Prisma `emissionFactor.update` mock resolves successfully

**Test Steps:**
1. Build a `NextRequest` with method `PUT`, body `{ factorKg: 3.5, unit: 'm³', source: 'UBA 2025' }`
2. Call the `PUT` handler from `src/app/api/factors/[id]/route.ts`
3. Assert response status and body

**Expected Result:**
- HTTP 200
- Response body equals the mocked updated record
- `prisma.emissionFactor.update` called with `{ where: { id }, data: { factorKg: 3.5, unit: 'm³', source: 'UBA 2025' } }`

**Test Data:** `id = 1`, `factorKg = 3.5`, `unit = 'm³'`, `source = 'UBA 2025'`

---

### TC-02: PUT /api/factors/[id] — immutable fields ignored

**Type:** Integration

**Description:**
`key`, `validYear`, and `scope` sent in the body are not written to the
database. The route must strip them before calling `update`.

**Preconditions:**
- Same mocks as TC-01

**Test Steps:**
1. Build a `PUT` request with body `{ factorKg: 3.5, unit: 'm³', source: 'UBA 2025', key: 'MODIFIED', scope: 'SCOPE2' }`
2. Assert `prisma.emissionFactor.update` is NOT called with `key` or `scope` in `data`

**Expected Result:**
- HTTP 200
- `data` passed to `update` only contains `factorKg`, `unit`, `source`

---

### TC-03: PUT /api/factors/[id] — invalid factorKg returns 400

**Type:** Integration

**Description:**
Sending a non-finite `factorKg` (e.g. `null`, `"abc"`, `Infinity`) returns a
German-locale 400 error.

**Preconditions:** No DB mocks needed (validation fires before DB call)

**Test Steps:**
1. Build a `PUT` request with body `{ factorKg: "abc", unit: 'kWh', source: 'Test' }`
2. Call the `PUT` handler
3. Assert status 400 and German `error` field

**Expected Result:**
- HTTP 400
- Body: `{ error: <German validation message> }`
- `prisma.emissionFactor.update` not called

---

### TC-04: PUT /api/factors/[id] — unknown id returns 404

**Type:** Integration

**Description:**
When the Prisma update throws a `P2025` "Record to update not found" error,
the route returns 404.

**Preconditions:**
- `prisma.emissionFactor.findUnique` returns `null` (or `update` throws P2025)

**Test Steps:**
1. Build a `PUT` request for a non-existent `id`
2. Mock `prisma.emissionFactor.update` to throw a Prisma P2025 error
3. Assert 404 response

**Expected Result:**
- HTTP 404
- Body: `{ error: <German message> }`

---

### TC-05: POST /api/factors — valid payload creates record

**Type:** Integration

**Description:**
`POST /api/factors` with a complete, valid body creates a new factor row
and returns 201 with the created record.

**Preconditions:**
- `prisma.emissionFactor.create` mock resolves with a new row

**Test Steps:**
1. Build a `POST` request with body
   `{ key: 'HOLZPELLETS', validYear: 2025, factorKg: 0.41, unit: 'kg', source: 'UBA 2025', scope: 'SCOPE1' }`
2. Call the `POST` handler
3. Assert 201 and body matches created record

**Expected Result:**
- HTTP 201
- `prisma.emissionFactor.create` called with correct data

---

### TC-06: POST /api/factors — duplicate (key, validYear) returns 409

**Type:** Integration

**Description:**
When `prisma.emissionFactor.create` throws a Prisma P2002 unique constraint
error, the route returns 409 with the German conflict message.

**Preconditions:**
- `prisma.emissionFactor.create` mock throws a Prisma `P2002` error

**Test Steps:**
1. Build a `POST` request for an already-existing `(key, validYear)` pair
2. Call the `POST` handler
3. Assert 409 response

**Expected Result:**
- HTTP 409
- Body: `{ error: 'Dieser Faktor existiert bereits für dieses Jahr.' }`

---

### TC-07: POST /api/factors — negative factorKg accepted

**Type:** Integration

**Description:**
`factorKg` may be negative (recycling credits). The route must not reject
negative values.

**Test Steps:**
1. Build a `POST` request with `factorKg: -1.5`
2. Call the `POST` handler with a successful mock
3. Assert 201

**Expected Result:**
- HTTP 201 (no validation error for negative value)

---

### TC-08: POST /api/factors — missing required fields return 400

**Type:** Integration

**Description:**
A request missing `key`, `validYear`, `factorKg`, or `scope` returns 400 with
a German error message.

**Test Steps:**
1. Build `POST` requests each missing one required field in turn
2. Call the `POST` handler for each
3. Assert 400 for each case

**Expected Result:**
- HTTP 400 for each incomplete request
- `prisma.emissionFactor.create` never called

---

### TC-09: GET /api/benchmarks — returns all rows for given year

**Type:** Integration

**Description:**
`GET /api/benchmarks?year=2024` returns all `IndustryBenchmark` rows for that
year as a JSON array.

**Preconditions:**
- `prisma.industryBenchmark.findMany` mock returns 7 benchmark rows

**Test Steps:**
1. Build a `GET` request with `?year=2024`
2. Call the `GET` handler from `src/app/api/benchmarks/route.ts`
3. Assert 200 and array of 7 items

**Expected Result:**
- HTTP 200
- Response is an array of `IndustryBenchmarkRow` objects
- `Cache-Control: no-store` header set

---

### TC-10: GET /api/benchmarks — missing year param returns 400

**Type:** Integration

**Description:**
`GET /api/benchmarks` without a `year` parameter returns 400.

**Test Steps:**
1. Build a `GET` request without query params
2. Call the `GET` handler
3. Assert 400

**Expected Result:**
- HTTP 400
- Body: `{ error: <German message> }`

---

### TC-11: PUT /api/benchmarks/[id] — valid payload updates record

**Type:** Integration

**Description:**
`PUT /api/benchmarks/[id]` with `{ co2ePerEmployeePerYear: 21.3 }` updates the
row and returns 200.

**Preconditions:**
- `prisma.industryBenchmark.update` mock resolves with updated row

**Test Steps:**
1. Build a `PUT` request for an existing `id` with body `{ co2ePerEmployeePerYear: 21.3 }`
2. Call the handler from `src/app/api/benchmarks/[id]/route.ts`
3. Assert 200 and updated record in body

**Expected Result:**
- HTTP 200
- Body contains `co2ePerEmployeePerYear: 21.3`

---

### TC-12: PUT /api/benchmarks/[id] — co2ePerEmployeePerYear ≤ 0 returns 400

**Type:** Integration

**Description:**
`co2ePerEmployeePerYear` must be > 0. Zero and negative values return 400 with
a German error message.

**Test Steps:**
1. Build `PUT` requests with `co2ePerEmployeePerYear: 0` and `co2ePerEmployeePerYear: -5`
2. Assert 400 for both

**Expected Result:**
- HTTP 400
- Body: `{ error: 'Wert muss größer als 0 sein' }` (or equivalent German message)

---

### TC-13: PUT /api/benchmarks/[id] — unknown id returns 404

**Type:** Integration

**Description:**
When the Prisma update throws P2025, the route returns 404.

**Test Steps:**
1. Mock `prisma.industryBenchmark.update` to throw P2025
2. Call `PUT` handler
3. Assert 404

**Expected Result:**
- HTTP 404
- German error message

---

### TC-14: POST /api/benchmarks — valid payload creates new year row

**Type:** Integration

**Description:**
`POST /api/benchmarks` with `{ branche: 'BAUGEWERBE', validYear: 2025, co2ePerEmployeePerYear: 22.0 }`
creates a new row and returns 201.

**Preconditions:**
- `prisma.industryBenchmark.create` mock resolves with the new row

**Test Steps:**
1. Build a `POST` request with the body above
2. Call the handler
3. Assert 201 and returned record

**Expected Result:**
- HTTP 201
- Body matches created benchmark row

---

### TC-15: POST /api/benchmarks — duplicate (branche, validYear) returns 409

**Type:** Integration

**Description:**
Prisma P2002 error on create maps to 409 with the German conflict message.

**Test Steps:**
1. Mock `prisma.industryBenchmark.create` to throw Prisma P2002
2. Call the `POST` handler
3. Assert 409

**Expected Result:**
- HTTP 409
- Body: `{ error: 'Dieser Benchmark existiert bereits für dieses Jahr.' }`

---

### TC-16: POST /api/benchmarks — invalid branche enum value returns 400

**Type:** Integration

**Description:**
A `branche` value not present in the `Branche` enum returns 400.

**Test Steps:**
1. Build a `POST` request with `branche: 'UNKNOWN_BRANCHE'`
2. Assert 400
3. Verify `prisma.industryBenchmark.create` not called

**Expected Result:**
- HTTP 400
- German validation error

---

### TC-17: DELETE /api/factors/[id] — returns 204 on success

**Type:** Integration

**Description:**
`DELETE /api/factors/[id]` deletes the record and returns 204 No Content.

**Preconditions:**
- `prisma.emissionFactor.delete` mock resolves successfully

**Test Steps:**
1. Build a `DELETE` request for `id = 1`
2. Call the `DELETE` handler
3. Assert 204

**Expected Result:**
- HTTP 204
- No response body
- `prisma.emissionFactor.delete` called with `{ where: { id: 1 } }`

---

### TC-18: DELETE /api/factors/[id] — unknown id returns 404

**Type:** Integration

**Description:**
When Prisma throws P2025 on delete, the route returns 404.

**Test Steps:**
1. Mock `prisma.emissionFactor.delete` to throw Prisma P2025
2. Call `DELETE` handler
3. Assert 404

**Expected Result:**
- HTTP 404
- German error message

---

### TC-19: EmissionFactorsTableEditable — renders rows in read mode

**Type:** Component

**Description:**
The component renders all provided `EmissionFactorRow[]` data with the edit and
delete icon buttons visible in the initial (non-editing) state.

**Preconditions:**
- Vitest environment: `jsdom` (configure via `@vitest-environment jsdom` docblock)
- `fetch` is mocked globally via `vi.stubGlobal`
- `useRouter` from `next/navigation` is mocked

**Test Steps:**
1. Render `<EmissionFactorsTableEditable rows={sampleRows} year={2024} />`
2. Assert that each row's factor key label, value, and unit appear in the DOM
3. Assert that edit (pencil) and delete (trash) buttons are present for each row

**Expected Result:**
- All rows rendered
- Edit and delete buttons accessible via `getByRole('button', { name: /bearbeiten/i })`

**Test Data:**
```ts
const sampleRows: EmissionFactorRow[] = [
  { id: 1, key: 'ERDGAS', validYear: 2024, factorKg: 2.02, unit: 'm³', source: 'UBA 2024', scope: 'SCOPE1' },
  { id: 2, key: 'STROM', validYear: 2024, factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', scope: 'SCOPE2' },
];
```

---

### TC-20: EmissionFactorsTableEditable — clicking Edit opens inline input

**Type:** Component

**Description:**
Clicking the edit icon for a row replaces the display value with a number input
containing the current `factorKg`, and shows Save/Cancel buttons.

**Test Steps:**
1. Render the component with `sampleRows`
2. Click the edit button for the first row using `userEvent.click`
3. Assert a number input is now visible with value `"2.02"` (or locale equivalent)
4. Assert Save and Cancel buttons are present

**Expected Result:**
- One `<input type="number">` present in the DOM
- Save button is initially enabled
- Cancel button reverts to display mode without API call

---

### TC-21: EmissionFactorsTableEditable — Save calls PUT and shows success toast

**Type:** Component

**Description:**
After editing, clicking **Save** calls `PUT /api/factors/1` with the new
value and triggers a `'Gespeichert.'` success toast.

**Test Steps:**
1. Mock `global.fetch` to return `{ ok: true, json: () => updatedRow }`
2. Render component, click edit on row 1, change value to `3.0`
3. Click Save button
4. Assert `fetch` was called with `PUT`, correct URL, and `{ factorKg: 3.0, ... }`
5. Assert toast mock or toast container shows success message

**Expected Result:**
- `fetch` called once with the correct payload
- Success toast shown
- Input replaced with updated display value

---

### TC-22: EmissionFactorsTableEditable — Cancel reverts without API call

**Type:** Component

**Description:**
Clicking Cancel discards the edited value and returns the row to read mode
without making an API call.

**Test Steps:**
1. Render component, enter edit mode for row 1, change value to `99`
2. Click Cancel
3. Assert `fetch` was not called
4. Assert row still shows original value `2.02`

**Expected Result:**
- Original value displayed
- No `fetch` call

---

### TC-23: EmissionFactorsTableEditable — negative value renders ♻ indicator

**Type:** Component

**Description:**
Rows with `factorKg < 0` display the ♻ recycling indicator and apply green
styling — consistent with the read-only `EmissionFactorsTable`.

**Test Steps:**
1. Render with a row where `factorKg = -1.5`
2. Assert `♻` character visible in that row
3. Assert green CSS class applied to that cell

**Expected Result:**
- ♻ visible
- Green styling applied

---

### TC-24: EmissionFactorsTableEditable — server error shows error toast

**Type:** Component

**Description:**
When `fetch` returns a non-OK response during save, the component shows an
error toast with the German error message.

**Test Steps:**
1. Mock `global.fetch` to return `{ ok: false, json: () => ({ error: 'DB error' }) }`
2. Enter edit mode, change value, click Save
3. Assert error toast shown

**Expected Result:**
- Error toast visible
- Row still in edit mode (value not overwritten)

---

### TC-25: IndustryBenchmarkTableEditable — renders rows in read mode

**Type:** Component

**Description:**
The component renders all `IndustryBenchmarkRow[]` data with German branche
labels and a pencil icon per row.

**Preconditions:**
- Same as TC-19 (jsdom, fetch mock, router mock)

**Test Steps:**
1. Render `<IndustryBenchmarkTableEditable rows={sampleBenchmarks} year={2024} />`
2. Assert German labels from `BRANCHE_LABELS` are displayed
3. Assert edit buttons present for each row

**Expected Result:**
- All 7 branche labels shown
- Edit buttons accessible

**Test Data:**
```ts
const sampleBenchmarks: IndustryBenchmarkRow[] = [
  { id: 1, branche: 'ELEKTROHANDWERK', validYear: 2024, co2ePerEmployeePerYear: 4.2 },
  { id: 2, branche: 'BAUGEWERBE', validYear: 2024, co2ePerEmployeePerYear: 18.7 },
];
```

---

### TC-26: IndustryBenchmarkTableEditable — Save calls PUT and shows success toast

**Type:** Component

**Description:**
After editing `co2ePerEmployeePerYear`, Save calls `PUT /api/benchmarks/[id]`
and shows `'Gespeichert.'` toast.

**Test Steps:**
1. Mock `global.fetch` to return `{ ok: true, json: () => updatedBenchmark }`
2. Render, click edit on row 1, change value to `21.3`
3. Click Save
4. Assert `fetch` called with `PUT /api/benchmarks/1`, body `{ co2ePerEmployeePerYear: 21.3 }`
5. Assert success toast

**Expected Result:**
- Correct `fetch` call
- Toast shown

---

### TC-27: IndustryBenchmarkTableEditable — client-side validation rejects ≤ 0

**Type:** Component

**Description:**
If the user enters `0` or a negative value and clicks Save, an inline
validation error is shown and `fetch` is NOT called.

**Test Steps:**
1. Render, enter edit mode for row 1, enter `0`
2. Click Save
3. Assert inline error text visible (e.g. `'Wert muss größer als 0 sein'`)
4. Assert `fetch` not called

**Expected Result:**
- Validation error shown below input
- No API call

---

### TC-28: IndustryBenchmarkTableEditable — only one row editable at a time

**Type:** Component

**Description:**
Clicking Edit on a second row while one is already in edit mode closes the
first row and opens the second.

**Test Steps:**
1. Render with two rows, click Edit on row 1 (input visible)
2. Click Edit on row 2
3. Assert row 1 is back in display mode
4. Assert row 2 is now in edit mode (input visible)

**Expected Result:**
- Only one input in the DOM at a time

---

## Test Data Requirements

No new fixture files required. All test data is inline in each test case as
typed TypeScript literals (`EmissionFactorRow[]`, `IndustryBenchmarkRow[]`).
Prisma client is mocked via `vi.mock('@/lib/prisma', ...)` following the
pattern in `src/lib/__tests__/factors.test.ts`.

---

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|---|---|---|
| `factorKg` is `null` | 400 validation error | TC-03, TC-08 |
| `factorKg` is `Infinity` | 400 validation error | TC-03 |
| `factorKg` is negative recycling credit | 201 / 200 accepted | TC-07 |
| `co2ePerEmployeePerYear` is `0` | 400 validation error | TC-12, TC-27 |
| `co2ePerEmployeePerYear` is negative | 400 validation error | TC-12 |
| Duplicate `(key, validYear)` on POST | 409 conflict | TC-06 |
| Duplicate `(branche, validYear)` on POST | 409 conflict | TC-15 |
| Unknown `id` on PUT / DELETE | 404 not found | TC-04, TC-13, TC-18 |
| Missing required body fields on POST | 400 missing field | TC-08 |
| Invalid `branche` enum on POST | 400 validation error | TC-16 |
| Invalid `scope` enum on POST factor | 400 validation error | TC-08 |
| Network error during client save | Error toast shown | TC-24 |
| User cancels mid-edit | No API call, original value restored | TC-22 |
| Two rows opened simultaneously | First row auto-cancelled | TC-28 |
| `GET /api/benchmarks` without year | 400 | TC-10 |

---

## Non-Functional Tests

### Error Response Format
All API error responses MUST use `{ error: "<German message>" }`. Tests
TC-03, TC-04, TC-06, TC-08, TC-10, TC-12, TC-13, TC-15, TC-16, TC-18 verify
this consistently.

### Cache-Control Header
`GET /api/benchmarks` must return `Cache-Control: no-store` (same as the
existing `GET /api/factors`). Verified in TC-09.

### Immutability of `key`, `validYear`, `scope` on PUT factor
TC-02 verifies that the `PUT /api/factors/[id]` handler only writes
`factorKg`, `unit`, and `source` to the database.

---

## Test File Locations

Following the project convention (co-located `__tests__` folders):

| Test Case(s) | File |
|---|---|
| TC-01 – TC-04 | `src/app/api/factors/[id]/__tests__/route.test.ts` |
| TC-05 – TC-08 | `src/app/api/factors/__tests__/route.test.ts` (extend existing) |
| TC-09 – TC-10 | `src/app/api/benchmarks/__tests__/route.test.ts` |
| TC-11 – TC-16 | `src/app/api/benchmarks/__tests__/route.test.ts` + `src/app/api/benchmarks/[id]/__tests__/route.test.ts` |
| TC-17 – TC-18 | `src/app/api/factors/[id]/__tests__/route.test.ts` |
| TC-19 – TC-24 | `src/components/settings/__tests__/EmissionFactorsTableEditable.test.tsx` |
| TC-25 – TC-28 | `src/components/settings/__tests__/IndustryBenchmarkTableEditable.test.tsx` |

### Component Test Environment Note

`EmissionFactorsTableEditable` and `IndustryBenchmarkTableEditable` are
`'use client'` components using `useState` and `fetch`. Their tests require
the `jsdom` environment and React Testing Library. Each test file should carry
the Vitest environment docblock:

```ts
// @vitest-environment jsdom
```

Mocking requirements:
- `global.fetch` → `vi.stubGlobal('fetch', vi.fn())`
- `next/navigation` → `vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))`
- `sonner` → `vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))`

---

## Open Questions

1. **`GET /api/benchmarks` without `year` param**: The architecture doc says
   "if omitted, return the most recent year available". TC-10 currently tests
   for 400. Confirm with Developer: should a missing year param fall back to
   most-recent or return 400? Adjust TC-10 accordingly.

2. **Add factor form fields**: Does `POST /api/factors` validation restrict `key`
   to the `EmissionCategory | MaterialCategory` enums, or are free-form keys
   allowed? This affects the scope of TC-08.
