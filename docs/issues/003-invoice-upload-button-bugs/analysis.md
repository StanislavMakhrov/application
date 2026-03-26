# Issue: Invoice Upload Button — Duplicate Button, Wrong Label, Wrong Position

## Problem Description

Three distinct UI bugs affect the invoice/document upload button in the wizard screens
that use both `UploadOCR` and `FieldDocumentZone` side-by-side (Screen2, Screen3, Screen4,
Screen5). The issues are:

1. **Duplicate button** — after uploading the first file, two upload buttons appear
   simultaneously instead of just one.
2. **Wrong button label** — the upload button reads "📄 Rechnung hochladen" but should
   read "📄 Rechnung hinzufügen".
3. **Wrong button position** — the upload button renders *before* the file list, but should
   appear *after* the file list.

---

## Steps to Reproduce

1. Open any wizard screen that has an OCR-enabled field (e.g. Screen 4 → Strom).
2. Observe the initial state: one button **"📄 Rechnung hochladen"** rendered *above* the
   empty-state placeholder — **Bug #3 (position)** and **Bug #2 (label)**.
3. Upload a file via that button.
4. After upload, observe **two** visible upload controls:
   - **"📄 Rechnung hochladen"** from `UploadOCR` (still rendered above the list)
   - **"+ Beleg hinzufügen"** from `FieldDocumentZone`'s `showAddButton` logic (rendered
     below the list)
   — **Bug #1 (duplicate)**.

---

## Expected Behavior

- At **all times** there is exactly **one** upload button.
- The button is always rendered **after** (below) the document list.
- The button always reads **"📄 Rechnung hinzufügen"** (both in empty state and once
  documents are present).

---

## Actual Behavior

- **Before first upload:** One button "📄 Rechnung hochladen" above the empty-state
  placeholder.
- **After first upload:** Two buttons simultaneously — "📄 Rechnung hochladen" (above list,
  from `UploadOCR`) and "+ Beleg hinzufügen" (below list, from `FieldDocumentZone`).

---

## Root Cause Analysis

### Affected Components

| File | Component | Role |
|------|-----------|------|
| `src/components/wizard/UploadOCR.tsx#L43` | `UploadOCR` | Renders the primary upload button (calls OCR API) |
| `src/components/wizard/FieldDocumentZone.tsx#L220` | `FieldDocumentZone` | Renders the document list and a secondary upload button |
| `src/components/wizard/screens/Screen2Heizung.tsx#L180` | Screen2 | Places `UploadOCR` *before* `FieldDocumentZone` |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx#L175` | Screen3 | Places `UploadOCR` *before* `FieldDocumentZone` |
| `src/components/wizard/screens/Screen4Strom.tsx#L168` | Screen4 | Places `UploadOCR` *before* `FieldDocumentZone` |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx#L110` | Screen5 | Places `UploadOCR` *before* `FieldDocumentZone` |

---

### Bug #1 — Duplicate Button

**Root cause:** Two separate components each render their own upload button, with no
coordination between them.

**`UploadOCR` (always visible):**
```tsx
// UploadOCR.tsx — button is always rendered, regardless of document count
<Button type="button" variant="outline" size="sm" onClick={...} disabled={isLoading}>
  {isLoading ? '⏳ Verarbeite...' : `📄 ${label}`}
</Button>
```

**`FieldDocumentZone` (visible once ≥1 doc exists):**
```tsx
// FieldDocumentZone.tsx — lines 217–224
const showAddButton = docs.length > 0;
// ...
{showAddButton && (
  <button type="button" ...>
    {isUploading ? 'Wird hochgeladen…' : '+ Beleg hinzufügen'}
  </button>
)}
```

The `suppressInitialUpload` prop correctly prevents the *empty-state* button inside
`FieldDocumentZone` from appearing alongside `UploadOCR`, but it has **no effect** on
the `showAddButton` logic (line 220: `const showAddButton = docs.length > 0`). Once the
first document is uploaded, `showAddButton` becomes `true` unconditionally, producing a
second visible button even when `suppressInitialUpload` is set.

**Why it went unnoticed:** `suppressInitialUpload` was added specifically to suppress
the empty-state button, but `showAddButton` was added independently without considering
the `suppressInitialUpload` flag.

---

### Bug #2 — Wrong Button Label

**Root cause:** The `UploadOCR` component's default `label` prop value is `'Rechnung hochladen'`
(line 43 of `UploadOCR.tsx`), and all call-sites in the screen components omit the `label`
prop, so they all inherit this default:

```tsx
// UploadOCR.tsx — line 43
label = 'Rechnung hochladen',
```

The correct label per UX specification is **"Rechnung hinzufügen"**.

---

### Bug #3 — Wrong Button Position

**Root cause:** In every screen component the `UploadOCR` element is placed **before** the
`FieldDocumentZone` element in JSX, so the button always renders above the document list:

```tsx
// Screen4Strom.tsx — lines 168–181 (same pattern in Screen2, Screen3, Screen5)
<UploadOCR          {/* ← button rendered FIRST (above list) */}
  category="STROM"
  ...
/>
<FieldDocumentZone  {/* ← document list rendered SECOND (below button) */}
  fieldKey="STROM"
  suppressInitialUpload
  ...
/>
```

The `UploadOCR` and `FieldDocumentZone` order must be swapped so the file list is shown
above the upload button.

---

## Suggested Fix Approach

Three independent, localised changes are required:

### Fix 1 — Eliminate the duplicate `showAddButton`

In `src/components/wizard/FieldDocumentZone.tsx`, gate `showAddButton` on
`suppressInitialUpload` being **false** (i.e. only show the secondary add-button when the
component is operating in standalone mode, without a parent `UploadOCR`):

```tsx
// Before
const showAddButton = docs.length > 0;

// After
const showAddButton = !suppressInitialUpload && docs.length > 0;
```

This ensures that when the parent screen already provides `UploadOCR` as the upload
mechanism (and passes `suppressInitialUpload`), no second button ever appears from
`FieldDocumentZone`.

### Fix 2 — Correct the default label

In `src/components/wizard/UploadOCR.tsx` change the default `label` prop value:

```tsx
// Before (line 43)
label = 'Rechnung hochladen',

// After
label = 'Rechnung hinzufügen',
```

Also update the empty-state standalone button in `FieldDocumentZone.tsx` (used when
`suppressInitialUpload` is false, i.e. fields without OCR such as refrigerant fields):

```tsx
// Before (FieldDocumentZone.tsx empty-state button)
{isUploading ? 'Wird hochgeladen…' : 'Rechnung hochladen'}

// After
{isUploading ? 'Wird hochgeladen…' : 'Rechnung hinzufügen'}
```

### Fix 3 — Move the upload button after the document list

In each screen that uses `UploadOCR` + `FieldDocumentZone`, swap their order so
`FieldDocumentZone` comes first:

```tsx
// Before (Screen4Strom.tsx, same pattern in Screen2, Screen3, Screen5)
<UploadOCR ... />
<FieldDocumentZone suppressInitialUpload ... />

// After
<FieldDocumentZone suppressInitialUpload ... />
<UploadOCR ... />
```

Affected files:
- `src/components/wizard/screens/Screen2Heizung.tsx` (three UploadOCR+FieldDocumentZone pairs)
- `src/components/wizard/screens/Screen3Fuhrpark.tsx`
- `src/components/wizard/screens/Screen4Strom.tsx` (two pairs: STROM, FERNWAERME)
- `src/components/wizard/screens/Screen5Dienstreisen.tsx`

---

## Related Tests

- [ ] Snapshot/render tests for `FieldDocumentZone` — verify `showAddButton` is not rendered when `suppressInitialUpload=true` and `docs.length > 0`
- [ ] Snapshot/render tests for `UploadOCR` — verify button label is "📄 Rechnung hinzufügen"
- [ ] Integration test for Screen4 (or any screen with OCR): assert single upload button in both empty and non-empty document states

---

## Additional Context

- The `suppressInitialUpload` prop was introduced alongside `UploadOCR` to avoid the
  empty-state button duplication, but the `showAddButton` (post-first-upload) case was
  overlooked.
- The standalone `FieldDocumentZone` flow (refrigerant fields in Screen2, with no `UploadOCR`)
  is unaffected by Fix 3 but should still receive Fix 2 (label) and Fix 1 has no impact on
  it because `suppressInitialUpload` defaults to `false`.
- All four fixes are confined to 6 files and require no schema, API, or state-management
  changes.
