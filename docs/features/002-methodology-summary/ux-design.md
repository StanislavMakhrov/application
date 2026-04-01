# UI/UX Design Specification: Methodik-Zusammenfassung & UBA-Parameterverwaltung

**Feature:** `002-methodology-summary`  
**Branch:** `copilot/add-methodology-summary-report`  
**Status:** Final

---

## Design-Übersicht

Diese Spezifikation umfasst drei Designbereiche:

1. **Methodik-Block im Dashboard** — ein kollabierter/expandierbarer Block, der die Berechnungsmethodik des ausgewählten Berichtsjahres zusammenfasst.
2. **Emissionsfaktoren-Einstellungen** — eine neue Sektion auf der Settings-Seite zur Verwaltung von UBA-Emissionsfaktoren pro Berichtsjahr.
3. **Methodik-Abschnitt im PDF** — Design-Vorgaben für den `@react-pdf/renderer`-basierten Methodik-Abschnitt in GHG-Protocol- und CSRD-PDF-Berichten.

**Designprinzipien:** Das Design folgt der bestehenden GrünBilanz-Sprache (Tailwind CSS, shadcn/ui, Markenfarben), priorisiert Klarheit für Prüfer und vermeidet visuelle Überfrachtung. Alle Texte sind auf Deutsch.

---

## Mockups

Alle Zustände sind als statische HTML-Dateien verfügbar — im Browser öffnen, Tailwind-Klassen direkt übernehmen:

| Datei | Inhalt |
|-------|--------|
| [mockups/index.html](mockups/index.html) | Navigationsseite zu allen Mockups |
| [mockups/methodology-summary-block.html](mockups/methodology-summary-block.html) | Dashboard-Block · collapsed, expanded, loading, empty, custom-factors |
| [mockups/emissionsfaktoren-settings.html](mockups/emissionsfaktoren-settings.html) | Settings-Sektion · Standard, Dirty-State, UBA-Dialog, Loading, No-Data, Fehler, Toast |
| [mockups/methodology-pdf.html](mockups/methodology-pdf.html) | PDF-Methodik-Abschnitt (A4-Simulation) · GHG-Protocol, benutzerdefiniert, CSRD |

> **Wichtig für den Entwickler:** Die HTML-Mockups sind die visuelle Wahrheit. Tailwind-Klassen direkt aus dem Quelltext kopieren. Die Mockups enthalten alle Zustände, die implementiert werden müssen.

---

## 1. Methodik-Block im Dashboard

### Übersicht

Der Block erscheint auf der Dashboard-Hauptseite (`src/app/page.tsx`) nach den KPI-Karten, vor dem Hauptinhaltsgrid. Er ist standardmäßig eingeklappt und kann durch Klick/Enter erweitert werden.

**Komponente:** `src/components/reports/MethodologySummary.tsx` (neu, `'use client'`)

### User Flow

```
Dashboard laden
  → Server lädt methodologyData(currentYearRecord.id)
  → MethodologySummary-Komponente gerendert (collapsed)
  → Nutzer sieht Headline: "Methodik · GHG Protocol · UBA 2024 · S1 S2 S3"
  → Klick/Enter → expandiert → vollständige Breakdown-Tabelle sichtbar
  → "Faktoren verwalten →"-Link führt zu /settings
```

### Layout & Komponenten-Struktur

```
<details> (oder shadcn/ui Accordion)
  <summary> ← fokussierbar, Enter/Space zum Öffnen
    [Icon 8×8 rounded-lg bg-brand-green-pale]
    [Headline "Methodik" + Subzeile mit Zusammenfassung]
    [Chevron-Icon (rotiert bei open)]
  </summary>
  <div> ← expandierter Inhalt
    [2×2 Grid: Berechnungsstandard | Emissionsfaktoren | Enthaltene Scopes | Dateneingabe]
    [Annahmen & Ausschlüsse Box]
    [Faktoren-Tabelle]
    [Footer: Erstellungshinweis + "Faktoren verwalten →"-Link]
  </div>
</details>
```

**Verwendete Komponenten:** `shadcn/ui` Accordion (empfohlen) oder natives `<details>`/`<summary>`.

### Eingeklappter Zustand (Default)

```
┌─────────────────────────────────────────────────────────────┐
│ [📄] Methodik                                    Details ›  │
│      GHG Protocol Corporate Standard · UBA 2024 · S1 S2 S3 │
└─────────────────────────────────────────────────────────────┘
```

**Subzeile:** `"{standard} · {factorSourceLabel} · {Scope-Chips}"`

- Scope-Chips: Scope 1 (grün), Scope 2 (blau), Scope 3 (lila) — nur eingeschlossene Scopes
- Bei benutzerdefiniertem Faktor-Label: Amber-Icon-Warnung + `"Benutzerdefiniert 2024"` statt UBA

**Tailwind-Klassen (Header):**
```
bg-white rounded-card border border-card-border shadow-card
px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors
```

### Expandierter Zustand

**Inhalt (von oben nach unten):**

#### 1. Meta-Info Grid (2×2)

```
┌─────────────────────────┬─────────────────────────┐
│ Berechnungsstandard     │ Emissionsfaktoren        │
│ GHG Protocol Corporate  │ UBA 2024 Emissions-      │
│ Standard                │ faktoren                 │
├─────────────────────────┼─────────────────────────┤
│ Enthaltene Scopes       │ Dateneingabe-Methoden    │
│ [S1] [S2] [S3]          │ 12 manuell · 3 OCR · 0  │
└─────────────────────────┴─────────────────────────┘
```

Klassen für Info-Box: `rounded-lg bg-gray-50 border border-gray-100 px-4 py-3`

#### 2. Annahmen & Ausschlüsse

Grün-getönte Box: `rounded-lg bg-brand-green-pale/30 border border-brand-green/10 px-4 py-3`  
Text: 14px, `text-gray-700`, `leading-relaxed`  
Fallback wenn leer: `"Keine besonderen Annahmen dokumentiert."` (grau, kursiv)

#### 3. Faktoren-Tabelle

Spalten: Kategorie | Schlüssel | Faktor (kg CO₂e) | Einheit | Scope | Quelle

- **UBA-Quelle:** Badge `bg-brand-green-pale text-brand-green-dark` (grüne Pille)
- **Benutzerdefiniert-Quelle:** Badge `bg-amber-100 text-amber-800` (amber Pille)
- Wenn mind. 1 Faktor benutzerdefiniert → Hinweiszeile unter Tabelle:
  `⚠ Ein oder mehrere Faktoren wurden manuell angepasst (Benutzerdefiniert 2024).` — amber text-xs

#### 4. Footer

`"Automatisch assembliert bei Berichtserstellung · Berechnungsstandard: GHG Protocol"` (grau, xs)  
Rechts: `"Faktoren verwalten →"` (brand-green, xs, hover:underline)

### Interaktionszustände

| Element | Default | Hover | Focus | Active |
|---------|---------|-------|-------|--------|
| Summary-Header | `bg-white` | `bg-gray-50` | Ring `focus-visible:ring-2 focus-visible:ring-brand-green` | — |
| Faktoren-Tabellenzeile | weiß/grau alternierend | `bg-gray-50` | — | — |
| "Faktoren verwalten →"-Link | `text-brand-green` | `underline` | Ring | — |
| Chevron | `rotate-0` | — | — | — |
| Chevron (expanded) | `rotate-180` | — | — | — |

### Skeleton-Loading-Zustand

Wenn `methodologyData` noch nicht geladen:
```html
<!-- Shimmer Skeleton -->
<div class="bg-white rounded-card border border-card-border shadow-card px-5 py-4">
  <div class="flex items-center gap-3">
    <div class="h-8 w-8 rounded-lg shimmer" />
    <div class="space-y-2">
      <div class="h-3.5 w-24 rounded shimmer" />
      <div class="h-3 w-72 rounded shimmer" />
    </div>
  </div>
</div>
```

Shimmer-Animation: `background: linear-gradient(90deg, #f0f4f0 25%, #e8ede8 50%, #f0f4f0 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.5s linear infinite`, Keyframes: `0% { background-position: 200% 0 }` → `100% { background-position: -200% 0 }`.

### Leerer Zustand (Kein Jahr / keine Daten)

Wenn kein `currentYearRecord` vorhanden:
- Block mit grauem Icon + `"Methodik nicht verfügbar"` + Hilfetext
- Keine Summary-Zeile, keine Chevron
- Nicht klickbar

### Variante: Benutzerdefinierte Faktoren

Wenn `factorSourceLabel.includes('Benutzerdefiniert')`:
- Icon-Hintergrund wechselt auf `bg-amber-50`
- Icon-Farbe wechselt auf `text-amber-600`
- Subzeile zeigt amber-farbenes Warn-Icon + `"Benutzerdefiniert 2024"` statt grüner Quellenangabe

---

## 2. Emissionsfaktoren-Einstellungen

### Übersicht

Neue Settings-Sektion in `src/app/settings/page.tsx`, nach der bestehenden "Berichtsjahre"-Sektion.

**Komponente:** `src/components/settings/EmissionsfaktorenSettings.tsx` (neu, `'use client'`)  
**Subkomponenten:** `EmissionsfaktorenTable.tsx`, `UbaFillButton.tsx`

### Positionierung in der Settings-Seite

```tsx
// Nach der "Berichtsjahre"-Sektion:
<section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="text-base font-semibold text-gray-800 mb-1">Emissionsfaktoren</h2>
  <p className="text-sm text-gray-500 mb-5">
    Emissionsfaktoren pro Berichtsjahr verwalten und offizielle UBA-Werte übernehmen.
  </p>
  <EmissionsfaktorenSettings />
</section>
```

### Komponenten-Layout

```
┌── Sektion-Header ────────────────────────────────────────────┐
│ h2: "Emissionsfaktoren"                                      │
│ p:  "Emissionsfaktoren pro Berichtsjahr verwalten…"          │
└──────────────────────────────────────────────────────────────┘
┌── Steuerleiste ─────────────────────────────────────────────┐
│ [Label "Berichtsjahr:"] [Dropdown ▾]    [UBA-Werte übern.] │
└──────────────────────────────────────────────────────────────┘
┌── [Optionaler Banner: Dirty-State-Hinweis] ─────────────────┐
│ ⚠ 2 Änderungen noch nicht gespeichert.                      │
└──────────────────────────────────────────────────────────────┘
┌── Faktoren-Tabelle ─────────────────────────────────────────┐
│ Kategorie | Schlüssel | Faktor | Einheit | Scope | Quelle   │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
┌── Footer-Aktionsleiste ─────────────────────────────────────┐
│ "Werte direkt bearbeiten…"     [Zurücksetzen] [Speichern]   │
└──────────────────────────────────────────────────────────────┘
```

### Jahr-Selector

**Komponente:** `<select>` (nativer Browser-Dropdown oder shadcn/ui Select)

```
Berichtsjahr: [2024 ▾]
```

- Optionen: alle `dbYears` aus `GET /api/emission-factors/years`
- Bei Jahreswechsel: Tabelle neu laden (Spinner in Tabelle, kein Page-Reload)
- Label: `"Berichtsjahr:"` text-sm font-medium text-gray-700
- Select: `appearance-none pl-3 pr-8 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg`

### UBA-Werte-übernehmen-Button

**Aktiv** (Jahr in `ubaReferenceYears`):
```
[↑ UBA-Werte übernehmen]
```
Klassen: `inline-flex items-center gap-2 rounded-lg border border-brand-green bg-white px-4 py-2 text-sm font-semibold text-brand-green hover:bg-brand-green-pale shadow-sm`

**Deaktiviert** (Jahr nicht in `ubaReferenceYears`):
- Button: `border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed`
- Tooltip (`:hover` auf Container): `"Keine offiziellen UBA-Werte für dieses Jahr verfügbar."`
- Tooltip-Positionierung: `absolute bottom-full right-0 mb-2` — dunkle Box, weißer Text

### Faktoren-Tabelle

**Spalten:**

| Spalte | Breite (approx.) | Inhalt |
|--------|--------|--------|
| Kategorie | 20% | Deutsches Label (z.B. "Erdgas") |
| Schlüssel | 18% | `font-mono text-gray-500` (z.B. "ERDGAS") |
| Faktor (kg CO₂e) | 15% | Inline-`<input type="number">` rechtsbündig |
| Einheit | 10% | Text (z.B. "m³", "kWh") |
| Scope | 12% | Scope-Chip (farbig) |
| Quelle | 15% | Badge (UBA oder Benutzerdefiniert) |

**Inline-Input-Feld:**
- `width: 80px; text-align: right; border: 1px solid #E2EAE5; border-radius: 6px; padding: 3px 8px; font-size: 12px`
- Focus: `border-color: #2D6A4F; box-shadow: 0 0 0 2px rgba(45,106,79,0.18)`
- Bei Änderung (dirty): `border-color: #F59E0B; background-color: #FFFBEB`
- `aria-label="Faktor für {label}"`

**Dirty-State (geänderte Zeile):**
- Zeilen-Hintergrund: `#FFFBEB` (amber-50)
- Linke Randborderung: `border-left: 3px solid #F59E0B`
- Quelle-Zelle: neues Badge `"Benutzerdefiniert 2024"` + durchgestrichener alter Wert (`text-xs text-gray-400 line-through`)
- Dirty-Banner über Tabelle: `⚠ N Änderungen noch nicht gespeichert.` (amber-50/amber-200)

**Scope-Chips:**
```
Scope 1: bg-green-100 text-green-800
Scope 2: bg-blue-100 text-blue-800
Scope 3: bg-purple-100 text-purple-800
```
Klassen: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold`

**Quell-Badges:**
```
UBA {Jahr}:            bg-brand-green-pale text-brand-green-dark (grün)
Benutzerdefiniert {J}: bg-amber-100 text-amber-800              (amber)
```
Klassen: `text-xs font-medium px-2 py-0.5 rounded-full`

### Speichern / Zurücksetzen

**Speichern-Button (dirty)**:
```
[✓ Änderungen speichern]
```
Klassen: `rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-dark shadow-sm`

**Speichern-Button (kein Dirty)**:
```
[Änderungen speichern]  ← disabled
```
Klassen: `rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400 cursor-not-allowed`

**Zurücksetzen-Button** (nur sichtbar wenn dirty):
```
[Zurücksetzen]
```
Klassen: `rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50`

### UBA-Bestätigungsdialog

Erscheint bei Klick auf "UBA-Werte übernehmen". Modal über der Seite.

**Layout:**
```
┌─────────────────────────────────────────┐
│ [⚠] UBA-Werte für 2024 übernehmen?      │
│                                         │
│ Dies überschreibt ALLE bestehenden      │
│ Faktoren für 2024 mit den offiziellen   │
│ UBA-Werten. Bestehende Werte (auch      │
│ manuell geänderte) werden ersetzt.      │
│                                         │
│ ┌──────────────────────────────────┐   │
│ │ ⚠ Diese Aktion kann nicht       │   │
│ │ rückgängig gemacht werden.       │   │
│ └──────────────────────────────────┘   │
│                                         │
│          [Abbrechen] [✓ Ja, übernehmen] │
└─────────────────────────────────────────┘
```

**Komponenten-Details:**
- Overlay: `fixed inset-0 bg-black/35` + `flex items-center justify-center p-4`
- Dialog-Card: `bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6`
- Icon: Amber-Kreis (`bg-amber-100`) mit Warn-Icon
- Warnung-Box: `rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800`
- Abbrechen: Outlined-Button
- Bestätigen: `bg-brand-green text-white` Primary-Button

**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Focus auf Dialog bei Öffnen, Escape-Key schließt.

### Loading-Zustand (Jahreswechsel)

Wenn Faktoren für ein neues Jahr geladen werden:
- Spinner-Icon in der Tabelle (oder Skeleton-Zeilen)
- Steuerleiste bleibt aktiv
- Tabellen-Container: `opacity-50 pointer-events-none` während des Ladens

### Kein UBA-Datensatz (z.B. 2025)

- UBA-Button deaktiviert (s.o.)
- Info-Banner unter Steuerleiste:  
  `ℹ Für 2025 sind noch keine offiziellen UBA-Referenzwerte hinterlegt. Faktoren können manuell eingetragen werden.`  
  Klassen: `rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800`

### Speicherfehler-Zustand

Fehlermeldung erscheint über den Aktions-Buttons (nicht über der Tabelle — Änderungen bleiben erhalten):

```
❌ Speichern fehlgeschlagen. Ihre Änderungen sind erhalten — bitte erneut versuchen.
```
Klassen: `flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800`

### Erfolgs-Toast (nach UBA-Übernahme)

Via `sonner` (bereits im Projekt verwendet):
```typescript
toast.success('UBA 2024 Faktoren übernommen', {
  description: '30 Faktoren erfolgreich aktualisiert.',
});
```

Toast-Design: Konsistent mit bestehenden `toast.success()`-Aufrufen in `FirmenprofilSettings.tsx`.

---

## 3. Methodik-Abschnitt im PDF

### Übersicht

Der Methodik-Abschnitt ersetzt den bisherigen statischen Text-Block in `GHGReport.tsx`. Er nutzt ausschließlich bestehende `@react-pdf/renderer`-Styles (aus `StyleSheet.create()`).

### GHG Protocol Report

**Position:** Letzter inhaltlicher Abschnitt, nach "Berichtsgrenzen". Beginnt auf neuer Seite wenn nötig (`wrap={false}` für die Tabelle).

**Struktureller Aufbau:**

```
Methodik                              ← sectionTitle (13px, bold, brand-green)
┌────────────────────────────────────┐
│ Berechnungsstandard  GHG Protocol  │ ← profileRow
│ Emissionsfaktoren   UBA 2024 …     │ ← profileRow
│ Enthaltene Scopes   Scope 1, 2, 3  │ ← profileRow
│ Dateneingabe        12 manuell …   │ ← profileRow
└────────────────────────────────────┘
┌────────────────────────────────────┐
│ Annahmen & Ausschlüsse             │ ← boundaryBox (grün getönt)
│ [Text aus reportingBoundaryNotes]  │
└────────────────────────────────────┘
[⚠ Hinweisbox bei benutzerdef. Faktoren — amber, nur wenn relevant]

Verwendete Emissionsfaktoren         ← kleiner sectionTitle (10px)
┌─────────────┬──────────┬────────┬──────┬─────────┬──────────┐
│ Kategorie   │ Schlüssel│ Faktor │ Einh.│  Scope  │  Quelle  │
├─────────────┼──────────┼────────┼──────┼─────────┼──────────┤
│ Erdgas      │ ERDGAS   │  2,00  │  m³  │ Scope 1 │ UBA 2024 │
│ ...         │ ...      │  ...   │  ... │ ...     │ ...      │
└─────────────┴──────────┴────────┴──────┴─────────┴──────────┘
[Fußnote: "Alle Faktoren in kg CO₂e …"]
```

### Quelle-Badge im PDF

**UBA {Jahr}:** `backgroundColor: '#D8F3DC', color: '#1B4332'`, `borderRadius: 999, padding: '1 6'`, 8px, bold  
**Benutzerdefiniert {Jahr}:** `backgroundColor: '#FEF3C7', color: '#92400E'`, gleiche Abstände

### Benutzerdefiniert-Hinweisbox

Nur gerendert wenn `factorSourceLabel.includes('Benutzerdefiniert')`:
```
backgroundColor: '#FFFBEB', border: '0.5 solid #F59E0B', borderRadius: 4
Label: "Hinweis: Benutzerdefinierte Faktoren" (8px, bold, amber)
Text: "Ein oder mehrere Emissionsfaktoren wurden gegenüber …" (8px, amber-dark)
```

### Leerer Annahmen-Fallback

Falls `assumptions === null && exclusions === null`:
→ Zeige `"Keine besonderen Annahmen dokumentiert."` (8px, grau, kursiv)  
→ `boundaryBox` nicht weglassen — bleibt sichtbar mit Fallback-Text

### CSRD-Fragebogen

**Position:** Nummerierter Abschnitt `"6. Berechnungsmethodik"` — nach bestehenden 5 Abschnitten, als Teil des Dokumentenkorpus.

**Unterschiede zum GHG-Bericht:**
- Extra Zeile: `"Berichtspflicht: CSRD / ESRS E1 (Klimawandel)"`
- Faktoren-Tabelle: nur Top-10 häufigste Faktoren + Hinweis `"Vollständige Faktorliste im GHG-Protocol-Bericht."`
- Kein separates Amber-Hinweis-Box (zu detailliert für CSRD-Fragebogen)

---

## Interaktions-Matrix

### Dashboard-Block

| Element | Default | Hover | Focus | Disabled |
|---------|---------|-------|-------|----------|
| Kollaps-Header | weiß, `shadow-card` | `bg-gray-50` | `ring-2 ring-brand-green` | — |
| Chevron | 0° | — | — | — |
| Chevron (open) | 180° | — | — | — |
| Faktoren-Tabellenzeile | weiß/grau | `bg-gray-50` | — | — |
| "Faktoren verwalten"-Link | `text-brand-green` | `underline` | Ring | — |

### Settings-Tabelle

| Element | Default | Hover | Focus | Dirty | Error |
|---------|---------|-------|-------|-------|-------|
| Tabellenzeile | weiß/grau | `bg-gray-50` | — | `bg-amber-50 + left-border amber` | — |
| Inline-Input | `border-gray-200` | — | `border-brand-green ring` | `border-amber-400 bg-amber-50` | `border-red-400` |
| UBA-Button (aktiv) | weiß, brand-green border | `bg-brand-green-pale` | Ring | — | — |
| UBA-Button (inaktiv) | grau, disabled | — | — | — | — |
| Speichern-Button (dirty) | `bg-brand-green` | `bg-brand-green-dark` | Ring | — | — |
| Speichern-Button (clean) | `bg-gray-100 text-gray-400` | — | — | — | — |

---

## Responsives Verhalten

### Dashboard-Block: `MethodologySummary`

#### Mobile (<640px)
- Summary-Header: kompaktere Padding (`px-4 py-3.5`)
- Subzeile: nur `"UBA 2024 · S1 S2 S3"` (kein Standard-Text wegen Platzmangel)
- `"Details anzeigen"`-Label ausgeblendet
- Expandierter Inhalt: 1-spaltig (kein 2×2-Grid), `grid-cols-1`
- Faktoren-Tabelle: horizontal scrollbar (`overflow-x-auto`)

#### Tablet (640px–1024px)
- Subzeile: vollständig sichtbar
- Meta-Grid: `grid-cols-2`
- Faktoren-Tabelle: alle Spalten sichtbar

#### Desktop (>1024px)
- Volle Breite innerhalb `max-w-7xl`
- Kein Layout-Unterschied zu Tablet (Block ist nie mehr als 800px breit)

### Settings: `EmissionsfaktorenSettings`

#### Mobile (<640px)
- Steuerleiste: vertikal gestapelt (Dropdown + Button untereinander)
- Faktoren-Tabelle: `overflow-x-auto`, `min-w-[600px]`
- Aktionsleiste: Button-Gruppe rechtsbündig, Hint-Text darüber

#### Tablet (640px–1024px) / Desktop (>1024px)
- Settings-Seite: `max-w-3xl` (identisch mit bestehenden Sektionen)
- Steuerleiste: horizontal (`flex items-center justify-between`)
- Faktoren-Tabelle: volle Breite, alle Spalten

---

## Barrierefreiheit (WCAG 2.1 AA)

### Dashboard-Block

```html
<!-- Korrekte ARIA-Implementierung mit shadcn/ui Accordion: -->
<button
  aria-expanded="false"
  aria-controls="methodik-content"
  id="methodik-trigger"
>
  Methodik...
</button>
<div
  id="methodik-content"
  role="region"
  aria-labelledby="methodik-trigger"
  hidden
>
  <!-- Expanded content -->
</div>
```

- **Tastatur:** Tab zum Fokus, Enter/Space zum Öffnen/Schließen
- **Screen Reader:** `aria-expanded` Zustandsänderung wird announced
- **Farbkontrast:** Alle Texte ≥ 4.5:1 Kontrast (brand-green #2D6A4F auf weiß: 7.2:1 ✓)
- **Fokus-Sichtbarkeit:** `focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2`

### Settings-Tabelle

- **Inline-Inputs:** `aria-label="Faktor für {label}"` — eindeutiger Label für jeden Input
- **Dirty-Hinweis:** `aria-live="polite"` auf dem Änderungs-Banner
- **Dialog:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` auf Titel
  - Focus-Trap bei geöffnetem Dialog
  - Escape-Key schließt Dialog
  - Focus kehrt zum auslösenden Button zurück bei Schließen
- **Disabled Button mit Tooltip:** `aria-disabled="true"` + `aria-describedby` → Tooltip-Text
- **Tabellen-Header:** `<th scope="col">` für Screenreader-Tabellennavigation

### Tastaturnavigation (Settings)

```
Tab     → Jahres-Dropdown → UBA-Button → Tabellen-Inputs (links-rechts) → Speichern
Enter   → Öffnet UBA-Dialog / Aktiviert Speichern
Escape  → Schließt Dialog
```

---

## Visuelle Spezifikationen

### Typografie

| Element | Klassen |
|---------|---------|
| Block-Headline | `text-sm font-semibold text-gray-800` |
| Block-Subzeile | `text-xs text-gray-500` |
| Info-Box Label | `text-xs font-medium text-gray-500` |
| Info-Box Value | `text-sm font-semibold text-gray-800` |
| Tabellen-Header | `text-xs font-semibold text-gray-600` |
| Tabellen-Zelle | `text-xs text-gray-800` |
| Monospace-Key | `text-xs font-mono text-gray-500` |
| Hinweis-Text | `text-xs text-gray-400` |
| Warnung-Text | `text-xs text-amber-700` |

### Farben

| Zweck | Token | Hex |
|-------|-------|-----|
| Primär-Grün | `brand-green` | `#2D6A4F` |
| Grün (Hover) | `brand-green-dark` | `#1B4332` |
| Grün (Pale) | `brand-green-pale` | `#D8F3DC` |
| UBA-Badge BG | `brand-green-pale` | `#D8F3DC` |
| UBA-Badge Text | `brand-green-dark` | `#1B4332` |
| Custom-Badge BG | `amber-100` | `#FEF3C7` |
| Custom-Badge Text | `amber-800` | `#92400E` |
| Dirty-Zeile BG | `amber-50` | `#FFFBEB` |
| Dirty-Border | `amber-400` | `#FBBF24` |
| Fehler | `red-600` | `#DC2626` |
| Info | `blue-700` | `#1D4ED8` |

### Abstände & Radien

| Element | Klassen |
|---------|---------|
| Block-Padding | `px-5 py-4` (Header), `px-5 py-5` (Content) |
| Sektions-Padding (Settings) | `p-6` |
| Info-Box-Padding | `px-4 py-3` |
| Tabellen-Zelle | `px-3 py-2` (Zeile), `px-3 py-2.5` (Header) |
| Card Border Radius | `rounded-card` (`border-radius: 12px`) |
| Badge Radius | `rounded-full` |
| Dialog Radius | `rounded-xl` |

### Schatten

| Element | Klassen |
|---------|---------|
| Dashboard-Block | `shadow-card` |
| Dialoge | `shadow-xl` |
| Settings-Sektion | `shadow-sm` |

---

## Animationen & Übergänge

| Interaktion | Trigger | Dauer | Easing |
|-------------|---------|-------|--------|
| Block öffnen/schließen | Click/Enter | 200ms | `ease-out` |
| Chevron-Rotation | Block toggle | 200ms | `ease` (CSS transition) |
| Hover-Hintergründe | `:hover` | 150ms | `ease` (`transition-colors`) |
| Dirty-Row-Highlight | Input-Änderung | 150ms | `ease` |
| Toast erscheinen | nach API-Erfolg | 300ms | `ease-out` (sonner default) |
| Dialog erscheinen | Button-Click | 150ms | `ease-out` |
| Skeleton-Shimmer | Loading | 1500ms | `linear` (infinite) |

**Accordion-Animation (Tailwind):**
```css
/* Wird von shadcn/ui Accordion bereitgestellt */
data-[state=open]:animate-accordion-down
data-[state=closed]:animate-accordion-up
```

---

## Deutsche UI-Texte

### Methodik-Block

| Schlüssel | Text |
|-----------|------|
| Block-Headline | `Methodik` |
| Collapsed-Hint | `Details anzeigen` |
| Berechnungsstandard-Label | `Berechnungsstandard` |
| Emissionsfaktoren-Label | `Emissionsfaktoren` |
| Scopes-Label | `Enthaltene Scopes` |
| Eingabe-Label | `Dateneingabe-Methoden` |
| Annahmen-Label | `Annahmen & Ausschlüsse` |
| Faktoren-Tabelle-Titel | `Verwendete Emissionsfaktoren` |
| Faktoren-Footer | `Automatisch assembliert bei Berichtserstellung · Berechnungsstandard: GHG Protocol Corporate Standard` |
| Manage-Link | `Faktoren verwalten →` |
| Leer-Headline | `Methodik nicht verfügbar` |
| Leer-Subtext | `Keine Emissionsdaten für dieses Jahr vorhanden. Bitte Daten im Assistenten erfassen.` |
| Keine-Annahmen-Fallback | `Keine besonderen Annahmen dokumentiert.` |
| Custom-Warn | `Ein oder mehrere Faktoren wurden manuell angepasst (Benutzerdefiniert {Jahr}).` |
| Eingabe-Manuell | `{n} manuelle Einträge` |
| Eingabe-OCR | `{n} per OCR-Beleg` |
| Eingabe-CSV | `{n} per CSV` |

### Emissionsfaktoren-Settings

| Schlüssel | Text |
|-----------|------|
| Sektion-Headline | `Emissionsfaktoren` |
| Sektion-Subtext | `Emissionsfaktoren pro Berichtsjahr verwalten und offizielle UBA-Werte übernehmen.` |
| Jahr-Label | `Berichtsjahr:` |
| UBA-Button | `UBA-Werte übernehmen` |
| UBA-Button-Disabled-Tooltip | `Keine offiziellen UBA-Werte für dieses Jahr verfügbar.` |
| Dirty-Banner | `{n} Änderungen noch nicht gespeichert.` (wobei n = Anzahl geänderter Zeilen) |
| Spalte-Kategorie | `Kategorie` |
| Spalte-Schlüssel | `Schlüssel` |
| Spalte-Faktor | `Faktor (kg CO₂e)` |
| Spalte-Einheit | `Einheit` |
| Spalte-Scope | `Scope` |
| Spalte-Quelle | `Quelle` |
| Speichern-Button | `Änderungen speichern` |
| Zurücksetzen-Button | `Zurücksetzen` |
| Hinweis-Footer | `Werte direkt bearbeiten und Speichern klicken.` |
| Kein-UBA-Info | `Für {Jahr} sind noch keine offiziellen UBA-Referenzwerte hinterlegt. Faktoren können manuell eingetragen werden.` |
| Fehler-Speichern | `Speichern fehlgeschlagen. Ihre Änderungen sind erhalten — bitte erneut versuchen.` |
| Toast-Erfolg | `UBA {Jahr} Faktoren übernommen` |
| Toast-Beschreibung | `{n} Faktoren erfolgreich aktualisiert.` |

### UBA-Bestätigungsdialog

| Schlüssel | Text |
|-----------|------|
| Dialog-Titel | `UBA-Werte für {Jahr} übernehmen?` |
| Dialog-Text | `Dies überschreibt alle bestehenden Faktoren für {Jahr} mit den offiziellen UBA-Werten. Bestehende Werte (auch manuell geänderte) werden ersetzt.` |
| Warnung | `Diese Aktion kann nicht rückgängig gemacht werden. Benutzerdefinierte Anpassungen gehen verloren und müssen ggf. erneut eingetragen werden.` |
| Abbrechen | `Abbrechen` |
| Bestätigen | `Ja, UBA-Werte übernehmen` |

### PDF (Methodik-Abschnitt)

| Schlüssel | Text |
|-----------|------|
| Abschnitt-Titel | `Methodik` |
| CSRD-Abschnitt-Titel | `6. Berechnungsmethodik` |
| Berechnungsstandard | `GHG Protocol Corporate Standard` |
| CSRD-Standard | `GHG Protocol Corporate Standard` |
| CSRD-Pflicht | `CSRD / ESRS E1 (Klimawandel)` |
| Faktoren-Abschnitt | `Verwendete Emissionsfaktoren` |
| Fußnote | `Alle Faktoren in kg CO₂e pro angegebener Einheit. Quellen: Umweltbundesamt (UBA), Berichtsjahr {Jahr}.` |
| Fußnote (Custom) | `Alle Faktoren in kg CO₂e pro angegebener Einheit. Quellen: Umweltbundesamt (UBA) und benutzerdefinierte Anpassungen.` |
| Custom-Hinweis-Label | `Hinweis: Benutzerdefinierte Faktoren` |
| Custom-Hinweis-Text | `Ein oder mehrere Emissionsfaktoren wurden gegenüber den offiziellen UBA-Werten manuell geändert. Einzelne angepasste Faktoren sind in der Tabelle mit „Benutzerdefiniert {Jahr}" gekennzeichnet.` |

---

## Kantenfälle (Edge Cases)

| Szenario | Verhalten |
|----------|-----------|
| Kein Berichtsjahr vorhanden | Dashboard-Block zeigt Leer-Zustand (keine Zusammenfassung, kein Expand) |
| Alle Emissionen = 0 | Block renderbar, Eingabe-Zählungen zeigen 0, Scopes-Liste leer → `"Enthaltene Scopes: —"` |
| Alle Scopes fehlen | `includedScopes = []` → `"Enthaltene Scopes: —"` im Block, kein Scope-Chip |
| Sehr langer Firmenname | `truncate` auf Subzeile, kein Overflow |
| Viele Faktoren (>30) | Tabelle scrollbar (`overflow-x-auto`), keine Pagination nötig (max. ~30 Faktoren erwartet) |
| Faktorwert = 0 | Normal anzeigen (Ökostrom hat 0,00 — valid) |
| Jahreswechsel während Dirty-State | Warnung: `"Sie haben ungespeicherte Änderungen für {aktuelles Jahr}. Verwerfen und wechseln?"` (browser `confirm` oder einfaches Modal) |
| UBA-Übernahme während Dirty | Dirty-State wird durch UBA-Übernahme ersetzt — kein Konflikt (Full-Replace) |
| Faktor mit negativem Wert | Input erlaubt negative Werte (`min` nicht gesetzt), Tabelle zeigt negativen Wert normal an |
| Netzwerkfehler bei Laden | `"Faktoren konnten nicht geladen werden."` + Retry-Button |
| `reportingBoundaryNotes` = null | Fallback-Text `"Keine besonderen Annahmen dokumentiert."` in allen Views |

---

## Komponenten-Checkliste für den Entwickler

### `MethodologySummary.tsx`
- [ ] Collapsed-Zustand: Headline + Subzeile mit Standard/Quelle/Scopes
- [ ] Expanded-Zustand: 2×2-Grid + Annahmen-Box + Faktoren-Tabelle + Footer-Link
- [ ] UBA vs. Benutzerdefiniert: Icon/Badge-Wechsel
- [ ] Scope-Chips (nur eingeschlossene Scopes rendern)
- [ ] Loading-Skeleton
- [ ] Leer-Zustand (kein Jahr)
- [ ] Keyboard-Accessibility (aria-expanded, aria-controls)
- [ ] Responsive: 1-spaltig auf Mobile

### `EmissionsfaktorenSettings.tsx`
- [ ] Jahr-Selector (Daten von `/api/emission-factors/years`)
- [ ] Tabellen-Laden bei Jahreswechsel (Skeleton)
- [ ] Inline-Editing mit Dirty-State
- [ ] Dirty-Banner + Dirty-Row-Highlight
- [ ] Speichern-Button (disabled wenn kein Dirty)
- [ ] Zurücksetzen (alle Änderungen verwerfen)
- [ ] Kein-UBA-Daten-Zustand (Info-Banner + disabled Button + Tooltip)
- [ ] Speicherfehler (Fehlerbanner, Änderungen erhalten)

### `UbaFillButton.tsx`
- [ ] Confirmation-Dialog (Modal)
- [ ] Disabled-State + Tooltip
- [ ] Loading-State während API-Call
- [ ] Erfolgs-Toast
- [ ] Fehlerbehandlung

---

*Spezifikation erstellt von UI/UX Designer Agent · Feature 002 · GrünBilanz*
