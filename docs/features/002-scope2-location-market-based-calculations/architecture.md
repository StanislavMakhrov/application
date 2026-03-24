# Architecture: Scope 2 Location-Based and Market-Based Calculations (Feature 002)

## Status

Implemented — no ADR required (change is confined to the calculation engine
and PDF template; no new infrastructure, schema changes, or architectural
decisions).

## Analysis

The existing architecture accommodates this feature with minimal disruption:

- `CO2eTotals` in `src/types/index.ts` is a plain interface — adding one field
  is non-breaking for all callers that already spread or destructure it,
  provided they are updated to supply the new field.
- `getTotalCO2e` in `src/lib/emissions.ts` already loops over all entries and
  accumulates per-scope totals.  The location-based value requires at most one
  extra `getEmissionFactor` call per entry (only when `isOekostrom = true`).
- `GHGReport.tsx` renders PDF sections from props — adding a conditional block
  requires no structural changes to the component API.
- No database migration is needed; the existing `isOekostrom` field on
  `EmissionEntry` is sufficient to determine which method applies.

## Implementation Guidance

### 1. `src/types/index.ts`

Add `scope2LocationBased: number` to `CO2eTotals`.  Document both fields with
inline comments explaining the GHG Protocol § 6.3 distinction.

All existing call sites that construct a `CO2eTotals` literal (e.g. the
`emptyTotals` in `src/app/page.tsx`) must be updated to include
`scope2LocationBased: 0`.

### 2. `src/lib/emissions.ts`

Introduce `scope2LocationKg` alongside `scope2Kg`.

Inside the entry accumulation loop, for every SCOPE2 entry:

```
scope2Kg += kg;   // market-based (existing)

if (entry.category === 'STROM' && entry.isOekostrom) {
  // second factor lookup — grid average
  const locationKg = await calculateCO2e(entry.category, entry.quantity, year, {
    isOekostrom: false,
  });
  scope2LocationKg += locationKg;
} else {
  scope2LocationKg += kg;   // same as market-based
}
```

Return both values in the `CO2eTotals` object.

### 3. `src/components/reports/GHGReport.tsx`

Add StyleSheet entries for the comparison box and its children.

Before the Scope 3 table call, insert a guarded block:

```tsx
const hasOekostrom = scope2Entries.some(
  (e) => e.isOekostrom && e.category === 'STROM'
);

{hasOekostrom && (
  <View>
    <Text>Scope 2: Vergleich locationbasiert vs. marktbasiert</Text>
    <View style={styles.scope2Box}>
      {/* location-based card */}
      {/* market-based card */}
    </View>
    <Text>…difference note with § 6.3 citation…</Text>
  </View>
)}
```

### 4. `src/components/wizard/screens/Screen4Strom.tsx`

Update only the `<p>` description under the Ökostrom checkbox.  No logic or
state changes required.

## Components Affected

| File | Change Type |
|------|-------------|
| `src/types/index.ts` | Add `scope2LocationBased` field to `CO2eTotals` |
| `src/lib/emissions.ts` | Accumulate `scope2LocationKg`; return in result |
| `src/app/page.tsx` | Add `scope2LocationBased: 0` to `emptyTotals` literal |
| `src/components/reports/GHGReport.tsx` | Add dual-method comparison block |
| `src/components/wizard/screens/Screen4Strom.tsx` | Update checkbox description copy |
| `src/lib/__tests__/emissions.test.ts` | Add two new unit test cases |
