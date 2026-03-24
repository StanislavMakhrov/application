# Test Plan: Check Report Conformity (Feature 001)

## Overview

Tests for `src/lib/conformity.ts` — the pure synchronous conformity engine that
validates emission data against GHG Protocol Corporate Standard and CSRD
supply-chain requirements. Because `runConformityChecks()` is a pure function
with no I/O, all tests run without mocking.

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---------------------|--------------|-----------|
| SC-01 — No Scope 1 → 🔴 badge, GHG-01 error | TC-01 | Unit |
| SC-02 — No Scope 2 → 🔴 badge, GHG-02 error | TC-02 | Unit |
| SC-05 — Diesel litre + km both present → DC-01 warning | TC-12 | Unit |
| SC-09 — All checks pass → 🟢 badge | TC-17 | Unit |
| GHG-01 – Scope 1 present | TC-01, TC-18 | Unit |
| GHG-02 – Scope 2 present | TC-02, TC-18 | Unit |
| GHG-03 – Year ≥ 2020 and 4-digit | TC-03, TC-04 | Unit |
| GHG-04 – Company profile complete | TC-05, TC-06 | Unit |
| GHG-05 – No negative total | TC-07 | Unit |
| GHG-W01 – Scope 3 assessed or acknowledged | TC-08, TC-09 | Unit |
| GHG-W02 – Likely-missing categories per Branche | TC-10 | Unit |
| GHG-W03 – Low data coverage (< 50 %) | TC-11 | Unit |
| GHG-W04 – Unusually low Scope 1 for vehicle Branche | TC-16 | Unit |
| DC-01 – Benzin/Diesel litre + km overlap | TC-12, TC-13 | Unit |
| DC-02 – TRANSPORTER_KM + LKW_KM both populated | TC-14 | Unit |
| CSRD-01 – Scope 3 Cat 1 materials | TC-19 | Unit |
| CSRD-02 – Business travel present or acknowledged | TC-20 | Unit |
| CSRD-03 – Commuting present or acknowledged | TC-21 | Unit |
| CSRD-04 – Ökostrom flag explicitly set | TC-22 | Unit |
| Badge state: konform | TC-17 | Unit |
| Badge state: hinweise | TC-23 | Unit |
| Badge state: nicht-konform | TC-01 | Unit |
| getMissingCategoryNotices — Branche mapping | TC-24, TC-25 | Unit |
| detectDoubleCounting — exported helper | TC-12, TC-13, TC-14 | Unit |

## Test Cases

### TC-01: runConformityChecks_noScope1Entries_returnsGHG01ErrorAndNichtKonform
**Type:** Unit  
**Input:** No entries with Scope 1 category; valid Scope 2 entry; complete profile; year 2024  
**Expected:** `status === 'nicht-konform'`, `errors` contains item with `id === 'GHG-01'`

---

### TC-02: runConformityChecks_noScope2Entries_returnsGHG02ErrorAndNichtKonform
**Type:** Unit  
**Input:** Valid Scope 1 entry; no STROM/FERNWAERME entry; complete profile; year 2024  
**Expected:** `status === 'nicht-konform'`, `errors` contains item with `id === 'GHG-02'`

---

### TC-03: runConformityChecks_yearBelow2020_returnsGHG03Error
**Type:** Unit  
**Input:** `year: 2019`; otherwise valid data  
**Expected:** `errors` contains `id === 'GHG-03'`

---

### TC-04: runConformityChecks_yearValidRange_noGHG03Error
**Type:** Unit  
**Input:** `year: 2024`; otherwise valid data  
**Expected:** `errors` does NOT contain `id === 'GHG-03'`

---

### TC-05: runConformityChecks_profileMissingFields_returnsGHG04Error
**Type:** Unit  
**Input:** `profile: { firmenname: '', branche: 'SHK', mitarbeiter: 0, standort: '' }`  
**Expected:** `errors` contains `id === 'GHG-04'`

---

### TC-06: runConformityChecks_profileNull_returnsGHG04Error
**Type:** Unit  
**Input:** `profile: null`  
**Expected:** `errors` contains `id === 'GHG-04'`

---

### TC-07: runConformityChecks_negativeTotalCO2e_returnsGHG05Error
**Type:** Unit  
**Input:** `totals: { scope1: -5, scope2: 0, scope3: 0, total: -5, byCategory: {} }`  
**Expected:** `errors` contains `id === 'GHG-05'`

---

### TC-08: runConformityChecks_noScope3AndNotAcknowledged_returnsGHGW01Warning
**Type:** Unit  
**Input:** No Scope 3 entries; `scope3Acknowledged: false`  
**Expected:** `warnings` contains `id === 'GHG-W01'`

---

### TC-09: runConformityChecks_noScope3ButAcknowledged_noGHGW01Warning
**Type:** Unit  
**Input:** No Scope 3 entries; `scope3Acknowledged: true`  
**Expected:** `warnings` does NOT contain `id === 'GHG-W01'`

---

### TC-10: runConformityChecks_elektrohandwerkMissingExpectedCategories_returnsGHGW02Warning
**Type:** Unit  
**Input:** `branche: 'ELEKTROHANDWERK'`; no `DIESEL_FUHRPARK` or `TRANSPORTER_KM` entry  
**Expected:** `warnings` contains `id === 'GHG-W02'`

---

### TC-11: runConformityChecks_lowDataCoverage_returnsGHGW03Warning
**Type:** Unit  
**Input:** Branche with multiple expected categories; only one out of four captured  
**Expected:** `warnings` contains `id === 'GHG-W03'`

---

### TC-12: detectDoubleCounting_benzinLitresAndKmBothPresent_returnsDC01
**Type:** Unit  
**Input:** Entries: `BENZIN_FUHRPARK` qty 500 + `PKW_BENZIN_KM` qty 8000  
**Expected:** returned array contains issue with `id === 'DC-01'`

---

### TC-13: detectDoubleCounting_dieselLitresAndKmBothPresent_returnsDC01
**Type:** Unit  
**Input:** Entries: `DIESEL_FUHRPARK` qty 300 + `PKW_DIESEL_KM` qty 5000  
**Expected:** returned array contains issue with `id === 'DC-01'`

---

### TC-14: detectDoubleCounting_transporterKmAndLKWKmBothPresent_returnsDC02
**Type:** Unit  
**Input:** Entries: `TRANSPORTER_KM` qty 10000 + `LKW_KM` qty 20000  
**Expected:** returned array contains issue with `id === 'DC-02'`

---

### TC-15: detectDoubleCounting_onlyOneFuelMethod_returnsEmpty
**Type:** Unit  
**Input:** Only `DIESEL_FUHRPARK` (no km entries)  
**Expected:** returned array is empty

---

### TC-16: runConformityChecks_kfzWerkstattLowScope1_returnsGHGW04Warning
**Type:** Unit  
**Input:** `branche: 'KFZ_WERKSTATT'`; `totals.scope1: 0.1` (< 0.5 t)  
**Expected:** `warnings` contains `id === 'GHG-W04'`

---

### TC-17: runConformityChecks_allChecksPass_returnsKonform
**Type:** Unit  
**Input:** Scope 1 entry (qty > 0), Scope 2 entry (qty > 0), year 2024, complete profile, positive totals, scope3Acknowledged true  
**Expected:** `status === 'konform'`, `errors` is empty, `warnings` is empty

---

### TC-18: runConformityChecks_scope1And2Present_noGHG01or02Errors
**Type:** Unit  
**Input:** Both `ERDGAS` (Scope 1) and `STROM` (Scope 2) entries with qty > 0  
**Expected:** Neither `GHG-01` nor `GHG-02` in `errors`

---

### TC-19: runConformityChecks_noMaterialEntries_returnsCSRD01Info
**Type:** Unit  
**Input:** `materialEntries: []`  
**Expected:** `infos` contains `id === 'CSRD-01'`

---

### TC-20: runConformityChecks_noBusinessTravelAndNotAcknowledged_returnsCSRD02Info
**Type:** Unit  
**Input:** No `GESCHAEFTSREISEN_FLUG` or `GESCHAEFTSREISEN_BAHN`; `scope3Acknowledged: false`  
**Expected:** `infos` contains `id === 'CSRD-02'`

---

### TC-21: runConformityChecks_noCommutingAndNotAcknowledged_returnsCSRD03Info
**Type:** Unit  
**Input:** No `PENDLERVERKEHR`; `scope3Acknowledged: false`  
**Expected:** `infos` contains `id === 'CSRD-03'`

---

### TC-22: runConformityChecks_stromWithoutOekostromFlag_returnsCSRD04Info
**Type:** Unit  
**Input:** `STROM` entry; but `isOekostrom` not explicitly set (treated as missing)  
**Expected:** `infos` contains `id === 'CSRD-04'`  
**Note:** Spec says the flag must be *explicitly* set (true or false) — a `null`-like state triggers the info.

---

### TC-23: runConformityChecks_warningsOnlyNoErrors_returnsHinweise
**Type:** Unit  
**Input:** All error checks pass; at least one warning (e.g. GHG-W01)  
**Expected:** `status === 'hinweise'`

---

### TC-24: getMissingCategoryNotices_baugewerbeNoExpectedCategories_returnsNotices
**Type:** Unit  
**Input:** `branche: 'BAUGEWERBE'`; no `DIESEL_FUHRPARK`, `LKW_KM`, `PENDLERVERKEHR`, or materials  
**Expected:** Returned array contains notices referencing the expected missing categories

---

### TC-25: getMissingCategoryNotices_allExpectedCategoriesPresent_returnsEmpty
**Type:** Unit  
**Input:** `branche: 'BAUGEWERBE'`; all expected categories have entries  
**Expected:** Returned array is empty

---

## Test Data Requirements

No external test data files needed — all inputs are constructed inline as plain objects.

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|----------|-------------------|-----------|
| `profile: null` | GHG-04 error raised | TC-06 |
| `year: 2019` | GHG-03 error raised | TC-03 |
| Negative totals | GHG-05 error raised | TC-07 |
| `scope3Acknowledged: true` with no Scope 3 | GHG-W01 suppressed | TC-09 |
| Both diesel litre + km present | DC-01 raised | TC-13 |
| Only one fuel method | No DC-01 | TC-15 |
| All checks pass | `konform` status | TC-17 |
| Warnings only, no errors | `hinweise` status | TC-23 |

## Non-Functional Tests

None required — `runConformityChecks()` is synchronous and in-memory; performance
is not a concern at the unit-test level. Performance of PDF generation (SC-12,
< 3 s) is covered by existing integration/smoke tests.

## Open Questions

None — all acceptance criteria are testable with pure-function unit tests.
