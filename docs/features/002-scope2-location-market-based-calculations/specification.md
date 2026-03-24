# Feature: Scope 2 Location-Based and Market-Based Calculations

**Feature ID:** 002
**Status:** ✅ Implemented
**Issue:** [Feature]: Support location-based and market-based Scope 2 calculations (#59)

---

## Overview

GHG Protocol Corporate Standard § 6.3 requires companies to report Scope 2
electricity emissions under **both** the location-based and the market-based
method whenever supplier-specific evidence (e.g. a renewable energy certificate
or Ökostrom contract) is available.

Previously GrünBilanz produced a single Scope 2 value, toggled by the
`isOekostrom` flag: when the flag was set the lower Ökostrom factor was used;
otherwise the national grid average was used.  The two methods were never
shown side by side.

This feature extends the calculation engine to always produce both values and
enriches the PDF report with a side-by-side comparison block.

---

## User Goals

- The business owner wants the GHG Protocol PDF to satisfy § 6.3 and show
  reviewers (banks, Großkunden, CSRD supply-chain auditors) that both methods
  were considered.
- The business owner wants to understand *why* the two values differ and how
  large the difference is before downloading the report.
- The data-entry operator wants to know—directly in the wizard—that ticking the
  Ökostrom checkbox activates the market-based method and that both values will
  appear.

---

## Scope

### In Scope

| Item | Description |
|------|-------------|
| Dual Scope 2 totals | `CO2eTotals` gains `scope2LocationBased` (always grid average) alongside the existing `scope2` (market-based when Ökostrom evidence present, grid average otherwise). |
| Calculation engine | `getTotalCO2e` accumulates both totals in a single pass.  The extra factor lookup only fires for STROM entries with `isOekostrom = true`. |
| PDF comparison block | When any STROM entry has `isOekostrom = true`, the GHG Report appends a two-card side-by-side block after the Scope 2 table, labelled "Scope 2: Vergleich locationbasiert vs. marktbasiert", with GHG Protocol § 6.3 attribution. |
| Wizard copy update | The Ökostrom checkbox description in Screen4Strom is updated to explain that the checkbox activates the market-based method and triggers the dual-value report output. |

### Out of Scope

- Manual entry of a supplier-specific emission factor (the STROM_OEKOSTROM
  factor remains the single fixed value from the factors table).
- Uploading certificates or contract documents.
- Scope 2 dual-method for FERNWAERME entries (district heating has no
  equivalent market-based mechanism in the current factor catalogue).

---

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| SC-01 | `CO2eTotals.scope2LocationBased` is always populated (never `undefined`). |
| SC-02 | When `isOekostrom = false` for all STROM entries, `scope2 === scope2LocationBased`. |
| SC-03 | When `isOekostrom = true`, `scope2` uses the STROM_OEKOSTROM factor and `scope2LocationBased` uses the STROM factor. |
| SC-04 | The PDF comparison block is rendered if and only if at least one STROM entry has `isOekostrom = true`. |
| SC-05 | The PDF block shows both totals in tonnes CO₂e to three decimal places, their difference, and a GHG Protocol § 6.3 citation. |
| SC-06 | The wizard checkbox description clearly states the market-based / location-based distinction. |
| SC-07 | `CO2eTotals.total` continues to use the market-based `scope2` as the primary total per GHG Protocol hierarchy rules. |
| SC-08 | All existing unit tests continue to pass; two new unit tests cover the dual-value logic. |

---

## User-Facing Behaviour

### Wizard — Screen 4 (Strom)

The Ökostrom checkbox description is updated from the generic "Ökostrom-Zertifikat vorhanden?" copy to:

> Ökostrom-Zertifikat vorhanden? Aktiviert den **marktbasierten Ansatz**
> (0,030 kg CO₂e/kWh) zusätzlich zum locationbasierten Netzstrom-Durchschnitt
> (0,380 kg CO₂e/kWh). Der Bericht weist dann beide Werte aus (GHG Protocol § 6.3).

### PDF Report — Scope 2 Comparison Block

After the standard Scope 2 table, when Ökostrom data is present, a visually
distinct block is shown:

```
┌─────────────────────────────────────────────────────────────┐
│  Scope 2: Vergleich locationbasiert vs. marktbasiert        │
│  ┌──────────────────────────────┬──────────────────────────┐│
│  │ Locationbasiert              │ Marktbasiert             ││
│  │ (Netzstrom-Durchschnitt)     │ (lieferantenspezifisch)  ││
│  │  X.XXX t CO₂e               │  Y.YYY t CO₂e            ││
│  └──────────────────────────────┴──────────────────────────┘│
│  Erläuterung … Differenz: Z.ZZZ t CO₂e … GHG Protocol §6.3 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Summary

### Types (`src/types/index.ts`)

```typescript
export interface CO2eTotals {
  scope1: number;
  scope2: number;              // market-based (primary)
  scope2LocationBased: number; // always grid-average
  scope3: number;
  total: number;               // uses market-based scope2
  byCategory: Record<string, number>;
}
```

### Calculation engine (`src/lib/emissions.ts`)

- Accumulates `scope2LocationKg` in parallel with `scope2Kg`.
- For STROM entries with `isOekostrom = true`, calls `calculateCO2e` a second
  time with `isOekostrom: false` to obtain the grid-average value.
- For all other Scope 2 entries the two values are identical.

### PDF (`src/components/reports/GHGReport.tsx`)

- New StyleSheet entries: `scope2Box`, `scope2Card`, `scope2CardLabel`,
  `scope2CardValue`, `scope2Note`.
- `hasOekostrom` guard ensures the block is only rendered when relevant.

---

## Related

- Issue: `#59`
- PR: `#60`
- Tests: `src/lib/__tests__/emissions.test.ts`
