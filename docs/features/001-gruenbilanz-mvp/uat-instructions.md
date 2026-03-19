# UAT Instructions — GrünBilanz MVP (Feature 001)

## Overview

GrünBilanz is a CO₂ footprint calculator for German Handwerksbetriebe. This document
describes how to manually test the full user journey from registration through onboarding,
energy-data entry to the final PDF report.

The app uses **PostgreSQL** (via Prisma) and **JWT session auth** and always runs in full
production mode — there is no demo mode.

---

## Quick Start (Docker Compose)

The easiest way to run the app locally is with docker-compose, which starts both the app
and a PostgreSQL database automatically:

```bash
# 1. Clone the repository
git clone <repo-url> && cd application

# 2. Set the required AUTH_SECRET (use any long random string for local testing)
export AUTH_SECRET="$(openssl rand -base64 48)"

# 3. Start everything
docker compose up --build
```

Open <http://localhost:3000>.

Expected: browser redirects to `/login`.

---

## Environment Variables

| Variable       | Description                                  | Example |
|----------------|----------------------------------------------|---------|
| `DATABASE_URL` | PostgreSQL connection string                 | `postgresql://gruenbilanz:gruenbilanz_dev@db:5432/gruenbilanz` |
| `AUTH_SECRET`  | Secret key for JWT signing (min 32 chars)   | `$(openssl rand -base64 48)` |

The `docker-compose.yml` sets `DATABASE_URL` automatically. You only need to set
`AUTH_SECRET` (which is required and must not be left empty).

---

## Full UAT Journey

### 1. Start the app

```bash
export AUTH_SECRET="$(openssl rand -base64 48)"
docker compose up --build
```

Open <http://localhost:3000>.  
Expected: redirect to `/login`.

### 2. Register a new account (`/register`)

Fill in the registration form:

| Field     | Test value                    |
|-----------|-------------------------------|
| E-Mail    | `tester@example.de`           |
| Passwort  | `TestPass123`                 |

Click **Registrieren**.  
Expected: redirect to `/onboarding`.

### 3. Company Onboarding (`/onboarding`)

Fill in the company form:

| Field        | Test value              |
|--------------|------------------------|
| Firmenname   | `Musterbau GmbH`        |
| Branche      | `Baugewerbe`            |
| Mitarbeiter  | `12`                    |
| Standort     | `München`               |

Click **Weiter**. Expected: redirect to `/energy`.

### 4. Energy Data Entry (`/energy`)

Fill in annual energy consumption for the current year:

| Field           | Test value |
|-----------------|-----------|
| Strom (kWh)     | `45000`   |
| Erdgas (m³)     | `8000`    |
| Diesel (L)      | `3500`    |
| Heizöl (L)      | `0`       |

Click **Berechnen**. Expected: redirect to `/results/<year>`.

### 5. Results Page (`/results/<year>`)

Verify the CO₂ breakdown:

| Scope   | Source   | Expected approx.           |
|---------|----------|---------------------------|
| Scope 1 | Erdgas   | 16.0 t CO₂e               |
| Scope 1 | Diesel   | 9.275 t CO₂e              |
| Scope 2 | Strom    | 17.1 t CO₂e               |
| **Total** |        | **≈ 42.4 t CO₂e**         |

Verify the SVG benchmark chart renders and indicates the company's position relative
to the `Baugewerbe` industry quartiles.

### 6. PDF Report Download

Click **PDF-Bericht herunterladen**.  
Expected: a PDF file is downloaded containing the company name, year, scope breakdown,
and benchmark comparison.

### 7. Navigation and Logout

Use the top navigation bar to go back to energy entry and change values.  
Click **Abmelden** to log out.  
Expected: redirect to `/login`.

---

## Acceptance Criteria

- [ ] App loads and shows login page
- [ ] Registration creates a new account and redirects to onboarding
- [ ] Tailwind CSS styles render correctly (green colour scheme, card layout, form inputs)
- [ ] Onboarding form validates and submits, company data is persisted
- [ ] Energy form calculates correct Scope 1 & 2 totals, data is persisted
- [ ] Benchmark chart renders with company dot positioned correctly
- [ ] PDF downloads successfully and contains correct data
- [ ] Logout clears session and redirects to login
- [ ] Unauthenticated access to `/onboarding`, `/energy`, `/results/*` redirects to `/login`
