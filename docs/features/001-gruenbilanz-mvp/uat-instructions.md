# UAT Instructions — GrünBilanz MVP (Feature 001)

## Overview

GrünBilanz is a CO₂ footprint calculator for German Handwerksbetriebe. This document
describes how to manually test the full user journey from onboarding through energy-data
entry to the final PDF report.

---

## Access Modes

### Demo Mode (no Supabase credentials required)

When the app is deployed **without** `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` set, it runs in **Demo Mode**:

- No login required — the app redirects directly to `/onboarding`
- A yellow banner is shown at the top of every dashboard page: **"Demo-Modus aktiv"**
- All CO₂ calculation and PDF-export features work fully
- Data is stored in memory only and is not persisted between requests

**Demo credentials:** none needed — navigate directly to the app URL.

### Production Mode (Supabase configured)

When Supabase credentials are configured, full authentication is required.
Register a new account at `/register`, or create a user via
*Authentication → Users → Add user* in your Supabase project.

> **Note:** The Docker image built from this repository is always in **Demo Mode** (no
> Supabase credentials are set at build time). Production-mode testing requires a
> separately configured Supabase project and a custom Docker run with the env vars set.

---

## Full UAT Journey (Demo Mode)

### 1. Start the app

```bash
cd src
npm install
npm run dev
```

Open <http://localhost:3000>.  
Expected: browser redirects to `/onboarding` with the amber **Demo-Modus** banner visible.

### 2. Company Onboarding (`/onboarding`)

Fill in the company form:

| Field        | Test value              |
|--------------|------------------------|
| Firmenname   | `Musterbau GmbH`        |
| Branche      | `Baugewerbe`            |
| Mitarbeiter  | `12`                    |
| Standort     | `München`               |

Click **Weiter**. Expected: redirect to `/energy`.

### 3. Energy Data Entry (`/energy`)

Fill in annual energy consumption for the current year:

| Field           | Test value |
|-----------------|-----------|
| Strom (kWh)     | `45000`   |
| Erdgas (m³)     | `8000`    |
| Diesel (L)      | `3500`    |
| Heizöl (L)      | `0`       |

Click **Berechnen**. Expected: redirect to `/results/<year>`.

### 4. Results Page (`/results/<year>`)

Verify the CO₂ breakdown:

| Scope   | Source   | Expected approx.           |
|---------|----------|---------------------------|
| Scope 1 | Erdgas   | 16.0 t CO₂e               |
| Scope 1 | Diesel   | 9.275 t CO₂e              |
| Scope 2 | Strom    | 17.1 t CO₂e               |
| **Total** |        | **≈ 42.4 t CO₂e**         |

Verify the SVG benchmark chart renders and indicates the company's position relative
to the `Baugewerbe` industry quartiles.

### 5. PDF Report Download

Click **PDF-Bericht herunterladen**.  
Expected: a PDF file is downloaded containing the company name, year, scope breakdown,
and benchmark comparison.

### 6. Navigation

Use the top navigation bar to go back to energy entry and change values.  
Expected: updated totals shown on next visit to results page.

---

## Acceptance Criteria

- [ ] App loads without errors in demo mode (no login prompt)
- [ ] Tailwind CSS styles render correctly (green colour scheme, card layout, form inputs)
- [ ] Onboarding form validates and submits
- [ ] Energy form calculates correct Scope 1 & 2 totals
- [ ] Benchmark chart renders with company dot positioned correctly
- [ ] PDF downloads successfully and contains correct data
- [ ] Demo-Modus banner is always visible in demo mode
