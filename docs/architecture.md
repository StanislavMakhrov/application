# GrünBilanz — arc42 Architecture Documentation

**Version:** 1.1  
**Date:** 2026-03-24  
**Status:** Accepted

---

## Table of Contents

1. [Introduction and Goals](#1-introduction-and-goals)
2. [Architecture Constraints](#2-architecture-constraints)
3. [System Scope and Context](#3-system-scope-and-context)
4. [Solution Strategy](#4-solution-strategy)
5. [Building Block View](#5-building-block-view)
6. [Runtime View](#6-runtime-view)
7. [Deployment View](#7-deployment-view)
8. [Cross-cutting Concepts](#8-cross-cutting-concepts)
9. [Architecture Decisions](#9-architecture-decisions)
10. [Quality Requirements](#10-quality-requirements)
11. [Risks and Technical Debt](#11-risks-and-technical-debt)
12. [Glossary](#12-glossary)

---

## 1. Introduction and Goals

### 1.1 Product Overview

**GrünBilanz** is a B2B SaaS application for CO₂ footprint calculation and ESG reporting, targeted at German Handwerksbetriebe (craft businesses with 10–100 employees). The application follows the GHG Protocol Corporate Standard and uses official UBA 2024 emission factors.

The system is intentionally single-tenant — one installation serves one company. There is no authentication or login; the application opens directly to the dashboard.

### 1.2 Quality Goals

| Priority | Quality Goal | Scenario |
|---|---|---|
| 1 | Correctness | All CO₂e calculations must use versioned UBA emission factors from DB — never hardcoded values |
| 2 | Usability | A Handwerksmeister with no sustainability expertise should complete a full annual report in ≤ 20 min |
| 3 | Reliability | Partial data entry persists across browser sessions; no data loss on unexpected close |
| 4 | Performance | PDF report generation < 3 seconds; dashboard load < 2 seconds |
| 5 | Portability | Entire stack runs via `docker compose up` with no external cloud dependencies |

### 1.3 Stakeholders

| Stakeholder | Role | Expectations |
|---|---|---|
| Betriebsinhaber (Business Owner) | Primary user | Fast data entry, reliable PDF report for Großkunden / banks |
| Großkunde | Report recipient | PDF conforming to GHG Protocol Corporate Standard |
| Bank | Report recipient | ESG report for credit assessment |
| GrünBilanz operator | System operator | Zero-maintenance Docker deployment |

### 1.4 Data Flow Table

The table below is the canonical reference for what data enters the system, how it is entered, how often, and what it produces. No ambiguity is permitted.

| Data category | Scope | Input method | Typical frequency | Who provides it | Source document | Output produced |
|---|---|---|---|---|---|---|
| Firmenname | Profile | Manual | Once | Betriebsinhaber | — | PDF header, badge |
| Branche | Profile | Dropdown | Once | Betriebsinhaber | — | Branchenvergleich selection |
| Mitarbeiter (Anzahl) | Profile | Manual | Once / annual | Betriebsinhaber | HR records | Per-employee CO₂e KPI |
| Standort | Profile | Manual | Once | Betriebsinhaber | — | PDF header |
| Logo | Profile | Image upload | Once | Betriebsinhaber | JPEG/PNG | PDF & badge |
| Berichtsgrenzen & Ausschlüsse | Profile | Manual (text) | Once / annual | Betriebsinhaber | — | PDF Berichtsgrenzen section, CSRD questionnaire |
| Berichtsjahr | Header | Dropdown / create | Once per year | Betriebsinhaber | — | Year selector |
| Erdgas | Scope 1 | Manual / OCR / CSV | Annual | Betriebsinhaber | Gas-Jahresabrechnung (m³) | CO₂e Scope 1 |
| Heizöl | Scope 1 | Manual / OCR / CSV | Annual (per delivery) | Betriebsinhaber | Lieferschein (L) | CO₂e Scope 1 |
| Flüssiggas | Scope 1 | Manual / OCR / CSV | Annual (per delivery) | Betriebsinhaber | Lieferschein (kg) | CO₂e Scope 1 |
| Kältemittel (R410A, R32, R134A, Sonstige) | Scope 1 | Manual | Annual / per service | Betriebsinhaber | Kältemittelprotokoll (kg) | CO₂e Scope 1 |
| Diesel Fuhrpark | Scope 1 | Manual / OCR / CSV | Monthly–Annual | Betriebsinhaber | Tankbelege / DATEV (L) | CO₂e Scope 1 |
| Benzin Fuhrpark | Scope 1 | Manual / OCR / CSV | Monthly–Annual | Betriebsinhaber | Tankbelege / DATEV (L) | CO₂e Scope 1 |
| Fahrzeug-km (PKW/Transporter/LKW) | Scope 1 | Manual / CSV | Annual | Betriebsinhaber | Fahrtenbuch / DATEV (km) | CO₂e Scope 1 |
| Strom (inkl. Ökostrom-Flag, monatlich oder jährlich) | Scope 2 | Manual / OCR / CSV | Annual or monthly | Betriebsinhaber | Strom-Jahresabrechnung (kWh) | CO₂e Scope 2 |
| Fernwärme | Scope 2 | Manual / OCR / CSV | Annual | Betriebsinhaber | Fernwärme-Abrechnung (kWh) | CO₂e Scope 2 |
| Geschäftsreisen Flug | Scope 3 | Manual / CSV | Annual | Betriebsinhaber | Expense reports (km) | CO₂e Scope 3 |
| Geschäftsreisen Bahn | Scope 3 | Manual / CSV | Annual | Betriebsinhaber | Expense reports (km) | CO₂e Scope 3 |
| Pendlerverkehr | Scope 3 | Manual | Annual | Betriebsinhaber | HR estimate (km/day × MA) | CO₂e Scope 3 |
| Abfall (Restmüll, Bauschutt, Altmetall, Sonstiges) | Scope 3 | Manual / CSV | Annual | Betriebsinhaber | Waste contractor (kg) | CO₂e Scope 3 |
| Materialien (Kupfer, Stahl, Alu, Holz, PVC, Beton, Farben, Sonstige) | Scope 3 Cat.1 | Manual table | Annual | Betriebsinhaber | Lieferscheine / purchasing (kg) | CO₂e Scope 3 |
| PDF upload (OCR) | Transient | PDF/image upload | Per bill | Betriebsinhaber | Stromrechnung / Gasrechnung | Pre-filled numeric field |
| CSV import (DATEV) | Transient | .csv / .xlsx | Per period | Betriebsinhaber | DATEV export | Mapped wizard fields |
| Belege / Rechnungen (FieldDocuments) | Evidence | PDF/image upload per field | Per bill | Betriebsinhaber | Any utility bill, receipt | Attached to audit log entry |

### 1.5 User Session Narratives

#### Pattern A — One-Shot Annual Entry (≈ 20 minutes)

**Trigger:** Bank requests ESG report, or Großkunde sends supplier questionnaire in January/February.

**What the user has in front of them:** A folder with all annual utility bills, fuel receipts, and the DATEV annual summary.

**Session steps:**
1. User opens browser → lands on Dashboard; sees all categories marked "Nicht erfasst".
2. Clicks "+ Neues Jahr" → selects 2024 as Berichtsjahr.
3. Navigates to Screen 1 (Firmenprofil) → confirms or updates company data → clicks "Weiter".
4. Screen 2 (Heizung & Gebäude) → picks up gas bill, clicks "Rechnung hochladen", uploads PDF → OCR pre-fills 4.200 m³ → user confirms → clicks "Weiter".
5. Screen 3 (Fuhrpark) → uploads DATEV CSV → maps "Diesel Gesamt" column → 3 rows are populated → user edits one row → "Weiter".
6. Screen 4 (Strom & Fernwärme) → types 28.400 kWh manually → ticks "Ökostrom: Nein" → "Weiter".
7. Screen 5 (Dienstreisen & Pendler) → enters 2 employees × 25 km × 220 days = 11.000 km Pendler → "Weiter".
8. Screen 6 (Materialien) → adds 5 rows in the material table (Kupfer 320 kg, Stahl 180 kg, …) → "Weiter".
9. Screen 7 (Abfall) → enters 800 kg Restmüll → "Speichern".
10. Dashboard updates: all categories ✓, total CO₂e = 38.4 t.
11. Clicks "Bericht erstellen" → PDF generated in 2.3 seconds → download opens automatically.
12. Clicks "Lieferantenfragebogen (CSRD)" → CSRD PDF downloads.
13. Copies HTML badge snippet → pastes onto company website.

#### Pattern B — Progressive Entry Throughout the Year

**Trigger:** Bills arrive throughout the year; user enters data as they come.

**Session 1 — February (5 min):** User receives Strom-Jahresabrechnung → opens app → Dashboard shows 2024 year with most categories "Nicht erfasst" → navigates to Screen 4 → uploads PDF → confirms 28.400 kWh → saves → closes browser.

**Session 2 — March (5 min):** Gas bill arrives → opens app → Dashboard shows Strom ✓, rest empty → navigates to Screen 2 → uploads gas bill → confirms 4.200 m³ → saves.

**Session 3–6 — Throughout year (5 min each):** Monthly/quarterly fuel data from DATEV → CSV import on Screen 3 → values added/cumulated.

**Session 7 — December (15 min):** User completes Scope 3 screens (5, 6, 7) → all categories now ✓ or "Teilweise".

**Session 8 — January next year (5 min):** User opens app → reviews Dashboard for 2024 → adjusts any preliminary values to actuals → clicks "Bericht erstellen" → downloads final PDF.

**Key design requirement:** The wizard must support saving partial progress. Each screen auto-saves on field blur. Missing categories appear as "Nicht erfasst" on dashboard — they do not block report generation (they appear as "nicht erfasst" in the PDF's data quality section).

---

## 2. Architecture Constraints

### 2.1 Technical Constraints

| Constraint | Reason |
|---|---|
| Next.js 14, App Router, TypeScript | Fixed tech stack — no alternatives |
| Tailwind CSS + shadcn/ui | Fixed component library |
| Prisma ORM (schema-first, migrations in repo) | No raw SQL; all schema changes via migrations |
| React-PDF for PDF generation (Node.js runtime, never Edge) | Fixed — no Puppeteer, no pdfmake |
| Docker Compose with exactly 2 services (`app`, `tesseract`) | Fixed deployment topology |
| Single combined container: Next.js + PostgreSQL 15 in `app` service | Fixed — supervisord manages both processes |
| Tesseract OCR as separate container, REST API on port 3001 | Fixed OCR architecture |
| No external cloud services (no Supabase, no Stripe, no external APIs) | Air-gapped / self-hosted deployment |
| PostgreSQL data in Docker volume `gruenbilanz_pgdata` | Persistence across container restarts |
| All emission factors in DB (versioned by `valid_year`) — never hardcoded | Auditability, replaceability |
| Prisma migrations checked into repo | Reproducibility |

### 2.2 Organisational Constraints

| Constraint | Reason |
|---|---|
| No authentication, no login | Single-tenant; opens directly to dashboard |
| German UI throughout (all messages, labels, toasts in German) | Target audience: German Handwerksbetriebe |
| GHG Protocol Corporate Standard compliance | Required for Großkunden / banks |
| UBA 2024 emission factors | German statutory recommendation |

### 2.3 Conventions

| Convention | Reference |
|---|---|
| TypeScript strict mode | docs/conventions.md |
| Named exports (except Next.js page/layout conventions) | docs/conventions.md |
| Async/await over raw Promises | docs/conventions.md |
| Files ≤ 200–300 lines; refactor at that limit | docs/conventions.md |
| ESLint + Prettier; Husky pre-commit hooks | docs/conventions.md |
| Conventional Commits (feat, fix, docs, …) | docs/conventions.md |
| Mobile-first (375 px viewport, touch targets ≥ 44 px) | Problem statement |

---

## 3. System Scope and Context

### 3.1 Business Context Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              GrünBilanz System                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                          app container (port 3000)                     │  │
│  │                        Next.js 14 + PostgreSQL 15                      │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     tesseract container (port 3001)                    │  │
│  │                       Tesseract OCR REST API                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
         ↑                                           ↓ outputs
         │ inputs
         │
┌────────┴──────────────────┐           ┌──────────────────────────────────────┐
│   Betriebsinhaber         │           │          Empfänger (Recipients)       │
│                           │           │                                       │
│  Source documents:        │           │  • Großkunde (supplier questionnaire) │
│  • Strom-Jahresrechnung   │           │  • Bank (ESG report for credit)       │
│  • Gas-Jahresrechnung     │           │  • Company website (badge embed)      │
│  • Tankbelege / Fahrtenbuch│           │  • Internal (own records)             │
│  • DATEV-CSV export       │           └──────────────────────────────────────┘
│  • Lieferscheine          │
│  • Waste contractor docs  │           ┌──────────────────────────────────────┐
└───────────────────────────┘           │   UBA (Umweltbundesamt)               │
                                        │   (data source — NOT a live API)      │
                                        │   Emission factors seeded into DB     │
                                        │   as static seed data at first start  │
                                        │   valid_year = 2024                   │
                                        └──────────────────────────────────────┘
```

### 3.2 Technical Context

| Interface | Direction | Protocol | Format | Notes |
|---|---|---|---|---|
| Browser ↔ Next.js | Bidirectional | HTTPS (HTTP in dev) | HTML / JSON | App Router pages + API routes + Server Actions |
| Next.js ↔ PostgreSQL | Internal (localhost) | TCP 5432 | Prisma wire protocol | Both in same `app` container |
| Next.js → Tesseract | Outbound | HTTP | multipart/form-data | `POST http://tesseract:3001/extract` |
| Tesseract → Next.js | Response | HTTP | `{ text: string, confidence: number }` | Synchronous, no queue |
| User → PDF download | Outbound | HTTP attachment | `application/pdf` | Generated server-side by React-PDF |
| User → CSV import | Inbound | HTTP POST | `.csv` / `.xlsx` | Parsed server-side |

---

## 4. Solution Strategy

### 4.1 Key Decisions Overview

| Goal | Strategy | Decision reference |
|---|---|---|
| Simplified deployment | Single `app` container with supervisord (PostgreSQL + Next.js) | ADR-001 |
| Flexible emission data modelling | Unified `EmissionEntry` table with scope/category discriminator | ADR-002 |
| Data integrity for OCR | Staging table before user confirms OCR result | ADR-003 |
| Security during CSV parsing | Server-side CSV parsing (never client-side eval) | ADR-004 |
| Fast, reliable PDF generation | React-PDF on Node.js runtime | ADR-005 |
| Auditability of calculations | Emission factors versioned by `valid_year` in DB | ADR-006 |
| Traceability of data changes | Immutable `AuditLog` table linked to source documents | — |
| OCR replaceability | Thin interface (`lib/ocr/index.ts`) isolating stub from UI | — |

### 4.2 Technology Mapping

| Concern | Technology | Rationale |
|---|---|---|
| UI | Next.js 14 App Router + React | Server components reduce client JS bundle |
| Styling | Tailwind CSS + shadcn/ui | Consistent design system, accessible components |
| Database | PostgreSQL 15 | Relational, ACID, rich query for aggregations |
| ORM | Prisma | Type-safe, schema-first, migration tooling |
| OCR | Tesseract (Docker) | Open-source, German-language support, runs offline |
| PDF | React-PDF | Pure-JS, Node.js compatible, no headless browser overhead |
| CSV | server-side (papaparse or xlsx library) | Security: no untrusted code execution |

---

## 5. Building Block View

### 5.1 Level 1 — System Decomposition

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Dashboard (root — no login redirect)
│   ├── layout.tsx              # Root layout (German locale, font)
│   ├── settings/
│   │   └── page.tsx            # Settings page — year management (add + delete)
│   ├── wizard/
│   │   ├── [screen]/
│   │   │   └── page.tsx        # Wizard screens 1–7
│   │   └── layout.tsx          # Wizard shell (side nav, progress bar)
│   └── api/
│       ├── ocr/route.ts        # POST /api/ocr — proxy to Tesseract (or stub)
│       ├── csv/route.ts        # POST /api/csv — parse & return mapped data
│       ├── report/route.ts     # POST /api/report — generate PDF
│       ├── badge/route.ts      # GET  /api/badge — generate badge PNG/SVG/HTML
│       ├── entries/route.ts    # CRUD for emission entries
│       ├── audit/route.ts      # GET  /api/audit — query audit log
│       ├── documents/
│       │   └── [id]/route.ts   # GET  /api/documents/[id] — download uploaded file
│       └── field-documents/
│           └── route.ts        # GET/POST /api/field-documents — per-field attachments
├── components/
│   ├── dashboard/              # Dashboard widgets
│   │   ├── KpiCard.tsx         # Total CO₂e, per-employee, YoY trend
│   │   ├── ScopeDonut.tsx      # Scope 1/2/3 donut chart
│   │   ├── CategoryBarChart.tsx # Per-category bar chart within each scope
│   │   ├── YearOverYearChart.tsx # Year-over-year comparison chart
│   │   ├── BranchenvergleichCard.tsx # Branchenvergleich benchmark card
│   │   ├── CategoryStatusList.tsx # Per-category completion status
│   │   ├── YearSelector.tsx    # Year dropdown + "+ Neues Jahr" link
│   │   └── AuditLogPanel.tsx   # Collapsible audit log (last 50 changes)
│   ├── wizard/                 # Wizard screen components
│   │   ├── WizardNav.tsx       # Side navigation + progress bar
│   │   ├── UploadOCR.tsx       # PDF upload + OCR result confirmation
│   │   ├── CsvImport.tsx       # CSV upload + column mapping UI
│   │   ├── FieldDocumentZone.tsx # Per-field invoice/receipt attachment zone
│   │   ├── PlausibilityWarning.tsx # Inline amber warning for out-of-range values
│   │   ├── ScreenChangeLog.tsx # Collapsible last-5-changes log per wizard section
│   │   └── screens/
│   │       ├── Screen1Firmenprofil.tsx  # Company profile + reporting boundaries
│   │       ├── Screen2Heizung.tsx       # Heating: Erdgas, Heizöl, Flüssiggas, Kältemittel
│   │       ├── Screen3Fuhrpark.tsx      # Fleet: Diesel, Benzin, vehicle km
│   │       ├── Screen4Strom.tsx         # Electricity (annual/monthly/provider) + Fernwärme
│   │       ├── Screen5Dienstreisen.tsx  # Business travel + commuting
│   │       ├── Screen6Materialien.tsx   # Dynamic materials table
│   │       └── Screen7Abfall.tsx        # Waste categories
│   ├── reports/                # React-PDF document components
│   │   ├── GHGReport.tsx       # Full GHG Protocol PDF (incl. Berichtsgrenzen section)
│   │   └── CSRDQuestionnaire.tsx # CSRD supplier questionnaire PDF
│   ├── settings/
│   │   └── YearManagement.tsx  # Year add + delete UI
│   └── ui/                     # shadcn/ui re-exports
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── actions.ts              # Server Actions (saveEntry, saveCompanyProfile, …)
│   ├── emissions.ts            # CO₂e calculation engine
│   ├── factors.ts              # Emission factor lookup (by key + valid_year)
│   ├── ocr/
│   │   └── index.ts            # OCR interface (stub → future Claude/Tesseract call)
│   ├── csv/
│   │   └── index.ts            # CSV import interface (stub)
│   ├── pdf.ts                  # React-PDF render-to-buffer helper
│   └── utils.ts                # Shared utilities
├── types/
│   └── index.ts                # Shared TypeScript types (Scope, Category, labels, …)
└── prisma/
    ├── schema.prisma
    └── migrations/
docker/
├── init.sql                    # Schema + all seed data (run once on first start)
├── tesseract/
│   ├── Dockerfile
│   └── server.js               # Express REST API wrapping Tesseract CLI
├── supervisord.conf
└── healthcheck.sh
Dockerfile                      # Multi-stage: deps → builder → runner
docker-compose.yml
```

### 5.2 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────────────────────────────────────
// Company Profile — single row (id = 1 always)
// Added: reportingBoundaryNotes and exclusions for GHG Protocol Berichtsgrenzen section
// ─────────────────────────────────────────────────────────────────────────────
model CompanyProfile {
  id                      Int      @id @default(1)
  firmenname              String
  branche                 Branche
  mitarbeiter             Int
  standort                String   // "München, Bayern"
  logoPath                String?  // relative path inside container or base64
  reportingBoundaryNotes  String?  // free text — appears in PDF Berichtsgrenzen section
  exclusions              String?  // free text — Ausschlüsse & Annahmen
  updatedAt               DateTime @updatedAt
}

enum Branche {
  ELEKTROHANDWERK
  SHK
  BAUGEWERBE
  TISCHLER
  KFZ_WERKSTATT
  MALER
  SONSTIGES
}

// ─────────────────────────────────────────────────────────────────────────────
// Reporting Years
// ─────────────────────────────────────────────────────────────────────────────
model ReportingYear {
  id        Int      @id @default(autoincrement())
  year      Int      @unique   // e.g. 2024
  createdAt DateTime @default(now())

  entries         EmissionEntry[]
  materialEntries MaterialEntry[]
  stagingEntries  StagingEntry[]
  reports         Report[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Emission Entries — Scope 1, Scope 2, and Scope 3 activities.
// Decision: unified table with scope+category discriminator (see ADR-002).
//
// Extended fields added post-MVP:
//   billingMonth   — 1–12 for a monthly entry; null = annual entry
//   isFinalAnnual  — when true, this annual entry supersedes any monthly entries
//   providerName   — enables mid-year energy provider changes
//   auditLogs      — back-reference to AuditLog entries for this row
// ─────────────────────────────────────────────────────────────────────────────
model EmissionEntry {
  id              Int           @id @default(autoincrement())
  reportingYearId Int
  reportingYear   ReportingYear @relation(fields: [reportingYearId], references: [id], onDelete: Cascade)
  scope           Scope
  category        EmissionCategory
  quantity        Float
  memo            String?
  isOekostrom     Boolean       @default(false)
  inputMethod     InputMethod   @default(MANUAL)
  billingMonth    Int?          // 1–12 for monthly entry; null for annual
  isFinalAnnual   Boolean       @default(false)
  providerName    String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  auditLogs       AuditLog[]

  @@unique([reportingYearId, scope, category, billingMonth, providerName])
}

enum Scope {
  SCOPE1
  SCOPE2
  SCOPE3
}

enum EmissionCategory {
  // Scope 1 — direct
  ERDGAS
  HEIZOEL
  FLUESSIGGAS
  DIESEL_FUHRPARK
  BENZIN_FUHRPARK
  PKW_BENZIN_KM
  PKW_DIESEL_KM
  TRANSPORTER_KM
  LKW_KM
  R410A_KAELTEMITTEL    // refrigerant leak — Scope 1 direct
  R32_KAELTEMITTEL
  R134A_KAELTEMITTEL
  SONSTIGE_KAELTEMITTEL
  // Scope 2 — indirect energy
  STROM
  FERNWAERME
  // Scope 3 — activities
  GESCHAEFTSREISEN_FLUG
  GESCHAEFTSREISEN_BAHN
  PENDLERVERKEHR
  ABFALL_RESTMUELL
  ABFALL_BAUSCHUTT
  ABFALL_ALTMETALL
  ABFALL_SONSTIGES
}

enum InputMethod {
  MANUAL
  OCR
  CSV
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Entries — Scope 3 Category 1 (Purchased Materials)
// Separate table because: multiple rows per year (a table, not one value per category)
// and has a supplier name memo field (see ADR-002).
// ─────────────────────────────────────────────────────────────────────────────
model MaterialEntry {
  id              Int           @id @default(autoincrement())
  reportingYearId Int
  reportingYear   ReportingYear @relation(fields: [reportingYearId], references: [id], onDelete: Cascade)
  material        MaterialCategory
  quantityKg      Float
  supplierName    String?           // Memo only — not used in calculations
  inputMethod     InputMethod       @default(MANUAL)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  auditLogs       AuditLog[]
}

enum MaterialCategory {
  KUPFER
  STAHL
  ALUMINIUM
  HOLZ
  KUNSTSTOFF_PVC
  BETON
  FARBEN_LACKE
  SONSTIGE
}

// ─────────────────────────────────────────────────────────────────────────────
// Emission Factors — seeded from UBA 2024, versioned by valid_year
// Lookup: SELECT * FROM EmissionFactor WHERE key = $key AND validYear <= $year
//         ORDER BY validYear DESC LIMIT 1
// ─────────────────────────────────────────────────────────────────────────────
model EmissionFactor {
  id        Int      @id @default(autoincrement())
  key       String   // e.g. "ERDGAS", "STROM_MIX", "KUPFER"
  validYear Int      // e.g. 2024
  factorKg  Float    // kg CO₂e per unit
  unit      String   // "m³", "L", "kg", "kWh", "km"
  source    String   // "UBA 2024", "Ecoinvent 3.10"
  scope     Scope
  createdAt DateTime @default(now())

  @@unique([key, validYear])
}

// ─────────────────────────────────────────────────────────────────────────────
// Staging Entries — OCR and CSV import results before user confirmation
// Created when OCR/CSV produces a value; deleted after user confirms or cancels.
// Avoids polluting EmissionEntry with unconfirmed data (see ADR-003).
// ─────────────────────────────────────────────────────────────────────────────
model StagingEntry {
  id              Int           @id @default(autoincrement())
  reportingYearId Int
  reportingYear   ReportingYear @relation(fields: [reportingYearId], references: [id], onDelete: Cascade)
  scope           Scope
  category        EmissionCategory
  quantity        Float
  confidence      Float?   // 0.0–1.0; populated by OCR, null for CSV
  rawText         String?  // original OCR text for debugging
  source          StagingSource
  createdAt       DateTime @default(now())
  expiresAt       DateTime // staging entries auto-expire after 24h if not confirmed

  @@unique([reportingYearId, scope, category])
}

enum StagingSource {
  OCR
  CSV
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports — generated PDF files, keyed by year
// ─────────────────────────────────────────────────────────────────────────────
model Report {
  id              Int           @id @default(autoincrement())
  reportingYearId Int
  reportingYear   ReportingYear @relation(fields: [reportingYearId], references: [id], onDelete: Cascade)
  type            ReportType
  filePath        String        // path inside container, served as static file
  generatedAt     DateTime      @default(now())
}

enum ReportType {
  GHG_PROTOCOL
  CSRD_QUESTIONNAIRE
}

// ─────────────────────────────────────────────────────────────────────────────
// Industry Benchmarks — seeded, one row per Branche
// ─────────────────────────────────────────────────────────────────────────────
model IndustryBenchmark {
  id                    Int     @id @default(autoincrement())
  branche               Branche @unique
  co2ePerEmployeePerYear Float   // t CO₂e per employee per year
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Documents — per-field invoice/receipt attachments
// One attachment per (fieldKey, year). Stored on the container filesystem.
// fieldKey is a category string (e.g. "ERDGAS_2024"). Displayed as a green
// dashed zone under each numeric input field in the wizard.
// ─────────────────────────────────────────────────────────────────────────────
model FieldDocument {
  id               Int      @id @default(autoincrement())
  fieldKey         String   // e.g. "ERDGAS_2024"
  year             Int
  filePath         String
  originalFilename String
  mimeType         String
  uploadedAt       DateTime @default(now())

  @@unique([fieldKey, year])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
}

// ─────────────────────────────────────────────────────────────────────────────
// Uploaded Documents — original source documents stored in the DB
// Bytes are stored directly in PostgreSQL for self-contained deployment.
// Referenced by AuditLog entries to provide download evidence.
// ─────────────────────────────────────────────────────────────────────────────
model UploadedDocument {
  id          Int        @id @default(autoincrement())
  filename    String
  mimeType    String
  sizeBytes   Int
  content     Bytes      // file bytes stored in DB
  uploadedAt  DateTime   @default(now())
  auditLogs   AuditLog[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log — immutable record of every change to emission/material data.
// Supports field-level change tracking (oldValue → newValue).
// Links to source documents when data was imported via OCR or CSV.
// Shown in: AuditLogPanel on the Dashboard and ScreenChangeLog in wizard screens.
// ─────────────────────────────────────────────────────────────────────────────
model AuditLog {
  id              Int               @id @default(autoincrement())
  entityType      String            // "EmissionEntry", "MaterialEntry", "CompanyProfile"
  entityId        Int?
  action          AuditAction
  fieldName       String?           // which field changed
  oldValue        String?           // previous value serialised as string
  newValue        String?           // new value serialised as string
  inputMethod     InputMethod       @default(MANUAL)
  documentId      Int?
  document        UploadedDocument? @relation(fields: [documentId], references: [id])
  metadata        String?           // JSON: {"category":"ERDGAS", ...}
  emissionEntryId Int?
  emissionEntry   EmissionEntry?    @relation(fields: [emissionEntryId], references: [id], onDelete: SetNull)
  materialEntryId Int?
  materialEntry   MaterialEntry?    @relation(fields: [materialEntryId], references: [id], onDelete: SetNull)
  createdAt       DateTime          @default(now())
}
```

### 5.3 Key Schema Design Decisions

#### EmissionEntry vs MaterialEntry (see ADR-002)

`EmissionEntry` uses a unified table with `scope` and `category` discriminators. This covers all Scope 1, Scope 2, and Scope 3 activity entries (travel, commute, waste, refrigerants). The unique constraint is `@@unique([reportingYearId, scope, category, billingMonth, providerName])` — `null` `billingMonth` means an annual entry; non-null values are monthly entries (currently used for Strom Screen 4 monthly mode).

`MaterialEntry` is a **separate table** because Scope 3 Category 1 (purchased materials) is fundamentally a list — not a set of fixed categories. One year can have many `MaterialEntry` rows (one per purchased material type).

#### Monthly Electricity Billing (EmissionEntry extensions)

`EmissionEntry` was extended with three optional fields to support mid-year electricity billing:
- `billingMonth` (1–12): records a monthly sub-entry. `null` = annual entry.
- `isFinalAnnual` (boolean): when true, this annual entry supersedes all monthly entries for the category.
- `providerName` (string): allows separate entries per energy provider when a company switches providers mid-year.

These fields are used only by Screen 4 (Strom). All other screens create standard annual entries.

#### Refrigerant Tracking (Kältemittel)

Refrigerant leak emissions (R410A, R32, R134A, Sonstige) are Scope 1 direct emissions. They are stored as standard `EmissionEntry` rows with dedicated `EmissionCategory` enum values. Data source is the Kältemittelprotokoll (maintenance log). Screen 2 (Heizung) collects this data.

#### Audit Trail

Every `saveEntry` / `deleteEntry` / `saveCompanyProfile` Server Action creates an `AuditLog` row. The audit log:
- Records `entityType`, `action` (CREATE/UPDATE/DELETE), `fieldName`, `oldValue`, `newValue`
- Links to the source `UploadedDocument` when data arrived via OCR or CSV
- Is surfaced in two UIs: `AuditLogPanel` on the dashboard (global view) and `ScreenChangeLog` in each wizard screen (last 5 changes for that screen's categories)

#### Document Storage

Two document storage models serve different purposes:
- `UploadedDocument`: source documents (PDFs, CSVs) stored as `Bytes` in PostgreSQL. Referenced by `AuditLog` for provenance. Available at `GET /api/documents/[id]`.
- `FieldDocument`: one attachment per `(fieldKey, year)`. Shown as a green dashed zone under each numeric input field. Stored on the container filesystem. Available at `GET/POST /api/field-documents`.

#### Partial Data Storage (missing categories)

Missing categories are represented as **no row** in `EmissionEntry` / `MaterialEntry`. A row with a `NULL` quantity is never created. The dashboard shows "Nicht erfasst" when a category has no row.

#### Emission Factor Versioning

Each `EmissionFactor` row has a `validYear` (integer). The lookup function in `lib/factors.ts`:
```
SELECT factorKg FROM EmissionFactor
WHERE key = $key AND validYear <= $requestedYear
ORDER BY validYear DESC
LIMIT 1
```
If no factor exists at or before the requested year, a forward fallback selects the earliest factor newer than the requested year (handles 2023 data with only 2024 factors). When UBA publishes 2025 factors, they are added as new rows — existing calculations for 2024 are unaffected.

#### OCR/CSV Staging Area

OCR and CSV results are written to `StagingEntry` first. They are **never written directly** to `EmissionEntry`. The user sees the pre-filled value with a confidence indicator; after explicit confirmation, a Server Action moves the data from `StagingEntry` to `EmissionEntry`. Expired staging entries (> 24h) are cleaned up on next request. See ADR-003.

---

## 6. Runtime View

### 6.1 Sequence 1 — Manual Wizard Entry (one category, save, close, resume)

```
User                     Browser (Next.js)         Server Action         PostgreSQL
  │                            │                         │                    │
  │ Opens app                  │                         │                    │
  │──────────────────────────> │                         │                    │
  │                            │ GET /wizard/2           │                    │
  │                            │──────────────────────── │                    │
  │                            │                         │ SELECT EmissionEntry│
  │                            │                         │ WHERE year=2024    │
  │                            │                         │ AND screen=2       │
  │                            │ <─────────────────────── │                    │
  │ <────────────────────────  │                         │                    │
  │ Types "4200" in Erdgas     │                         │                    │
  │ field (onBlur triggers)    │                         │                    │
  │──────────────────────────> │                         │                    │
  │                            │ Server Action:          │                    │
  │                            │ saveEntry({             │                    │
  │                            │   year: 2024,           │                    │
  │                            │   scope: SCOPE1,        │                    │
  │                            │   category: ERDGAS,     │                    │
  │                            │   quantity: 4200,       │                    │
  │                            │   inputMethod: MANUAL   │                    │
  │                            │ })                      │                    │
  │                            │──────────────────────── >                    │
  │                            │                         │ UPSERT EmissionEntry│
  │                            │                         │ (ON CONFLICT UPDATE)│
  │                            │                         │────────────────────>│
  │                            │                         │ <──────────────────│
  │ Toast: "Gespeichert ✓"     │ <─────────────────────── │                    │
  │ <────────────────────────  │                         │                    │
  │ Closes browser             │                         │                    │
  │                            │                         │                    │
  │ (later) Reopens app        │                         │                    │
  │──────────────────────────> │                         │                    │
  │                            │ GET /wizard/2           │                    │
  │                            │──────────────────────── │                    │
  │                            │                         │ SELECT → row exists│
  │                            │ <─────────────────────── │                    │
  │ Sees "4200" pre-filled     │                         │                    │
  │ <────────────────────────  │                         │                    │
```

### 6.2 Sequence 2 — OCR Upload (PDF → Tesseract → pre-fill → confirm)

```
User           Browser          API Route (/api/ocr)    Tesseract (:3001)    DB
  │               │                    │                       │              │
  │ Uploads PDF   │                    │                       │              │
  │─────────────> │                    │                       │              │
  │               │ POST /api/ocr      │                       │              │
  │               │ multipart(file)    │                       │              │
  │               │───────────────────>│                       │              │
  │               │                    │ POST /extract         │              │
  │               │                    │ multipart(file)       │              │
  │               │                    │──────────────────────>│              │
  │               │                    │ { text, confidence }  │              │
  │               │                    │<──────────────────────│              │
  │               │                    │ regex parse           │              │
  │               │                    │ → quantity: 4200      │              │
  │               │                    │ → confidence: 0.89    │              │
  │               │                    │ UPSERT StagingEntry   │              │
  │               │                    │ (expires +24h)        │              │
  │               │                    │──────────────────────────────────────>
  │               │ { quantity:4200,   │                       │              │
  │               │   confidence:0.89 }│                       │              │
  │               │<───────────────────│                       │              │
  │ Field shown   │                    │                       │              │
  │ pre-filled    │                    │                       │              │
  │ "4200 m³ (89% │                    │                       │              │
  │ Konfidenz)"   │                    │                       │              │
  │<────────────  │                    │                       │              │
  │ Clicks        │                    │                       │              │
  │ "Bestätigen"  │                    │                       │              │
  │─────────────> │                    │                       │              │
  │               │ Server Action:     │                       │              │
  │               │ confirmStagingEntry│                       │              │
  │               │───────────────────>│                       │              │
  │               │                    │ DELETE StagingEntry   │              │
  │               │                    │ INSERT EmissionEntry  │              │
  │               │                    │ (inputMethod: OCR)    │              │
  │               │                    │──────────────────────────────────────>
  │ Toast: "Gespeichert ✓"             │                       │              │
  │<────────────  │                    │                       │              │
```

### 6.3 Sequence 3 — CSV Import (upload → mapping UI → field population → save)

```
User                    Browser                API /api/csv          DB
  │                         │                       │                 │
  │ Uploads .csv file       │                       │                 │
  │────────────────────────>│                       │                 │
  │                         │ POST /api/csv         │                 │
  │                         │ multipart(file)       │                 │
  │                         │──────────────────────>│                 │
  │                         │                       │ Parse CSV       │
  │                         │                       │ Return first 5  │
  │                         │                       │ rows + headers  │
  │                         │ { headers:[], rows:[] }│                 │
  │                         │<──────────────────────│                 │
  │ Column mapping UI shown │                       │                 │
  │<────────────────────────│                       │                 │
  │ Maps "Diesel Gesamt L"  │                       │                 │
  │ → category DIESEL_FUHRPARK│                     │                 │
  │ Maps "Benzin Total L"   │                       │                 │
  │ → category BENZIN_FUHRPARK│                     │                 │
  │ Clicks "Übernehmen"     │                       │                 │
  │────────────────────────>│                       │                 │
  │                         │ POST /api/csv/apply   │                 │
  │                         │ { mapping, data }     │                 │
  │                         │──────────────────────>│                 │
  │                         │                       │ UPSERT          │
  │                         │                       │ StagingEntry    │
  │                         │                       │ per mapped col  │
  │                         │                       │─────────────────>
  │                         │ { entries: [...] }    │                 │
  │                         │<──────────────────────│                 │
  │ Wizard fields           │                       │                 │
  │ pre-filled from staging │                       │                 │
  │<────────────────────────│                       │                 │
  │ Reviews, edits if needed│                       │                 │
  │ Clicks "Speichern"      │                       │                 │
  │────────────────────────>│                       │                 │
  │                         │ Server Action:        │                 │
  │                         │ confirmAllStaging()   │                 │
  │                         │──────────────────────────────────────────>
  │                         │                       │ DELETE staging  │
  │                         │                       │ INSERT entries  │
  │ Toast: "2 Werte importiert und gespeichert ✓"   │                 │
  │<────────────────────────│                       │                 │
```

### 6.4 Sequence 4 — Dashboard Load (aggregation queries)

```
Browser                   Server Component              PostgreSQL
  │                             │                            │
  │ GET /                       │                            │
  │────────────────────────────>│                            │
  │                             │ [parallel queries]         │
  │                             │───────────────────────────>│
  │                             │                            │ Q1: SELECT scope,
  │                             │                            │   SUM(quantity * f.factorKg)
  │                             │                            │   FROM EmissionEntry e
  │                             │                            │   JOIN EmissionFactor f ON
  │                             │                            │   f.key = e.category AND
  │                             │                            │   f.validYear = (
  │                             │                            │     SELECT MAX(validYear)
  │                             │                            │     FROM EmissionFactor
  │                             │                            │     WHERE key=e.category
  │                             │                            │     AND validYear <= $year)
  │                             │                            │   WHERE year = 2024
  │                             │                            │   GROUP BY scope
  │                             │                            │
  │                             │                            │ Q2: COUNT completed categories
  │                             │                            │   per screen
  │                             │                            │
  │                             │                            │ Q3: All years for YoY chart
  │                             │                            │
  │                             │                            │ Q4: IndustryBenchmark
  │                             │                            │   WHERE branche = $branche
  │                             │<───────────────────────────│
  │                             │ Render RSC                 │
  │ HTML + hydration            │                            │
  │<────────────────────────────│                            │
```

### 6.5 Sequence 5 — PDF Report Generation

```
User             Browser         API /api/report       PostgreSQL       React-PDF
  │                  │                  │                    │               │
  │ Clicks           │                  │                    │               │
  │ "Bericht         │                  │                    │               │
  │ erstellen"       │                  │                    │               │
  │─────────────────>│                  │                    │               │
  │                  │ POST /api/report │                    │               │
  │                  │ { year: 2024 }   │                    │               │
  │                  │─────────────────>│                    │               │
  │                  │                  │ Fetch full data:   │               │
  │                  │                  │ - CompanyProfile   │               │
  │                  │                  │ - All EmissionEntry│               │
  │                  │                  │ - All MaterialEntry│               │
  │                  │                  │ - EmissionFactors  │               │
  │                  │                  │ - IndustryBenchmark│               │
  │                  │                  │───────────────────>│               │
  │                  │                  │<───────────────────│               │
  │                  │                  │ renderToBuffer(    │               │
  │                  │                  │   <GHGReport       │               │
  │                  │                  │     data={...}/>)  │               │
  │                  │                  │────────────────────────────────────>
  │                  │                  │<────────────────────────────────────
  │                  │                  │ Buffer (PDF bytes) │               │
  │                  │                  │ Save to /reports/2024-ghg.pdf      │
  │                  │                  │ INSERT Report row  │               │
  │                  │                  │───────────────────>│               │
  │                  │                  │<───────────────────│               │
  │                  │ 200 Content-Type:│                    │               │
  │                  │ application/pdf  │                    │               │
  │                  │<─────────────────│                    │               │
  │ PDF download     │                  │                    │               │
  │ opens (≤ 3s)     │                  │                    │               │
  │<─────────────────│                  │                    │               │
```

### 6.6 Sequence 6 — Progressive Entry Pattern (3 separate sessions)

This illustrates that the wizard state is always reconstructed from the database; the browser holds no persistent state.

```
Session 1 (February — Strom):
  User opens app → GET / → Dashboard (all categories Nicht erfasst)
  Navigates to Screen 4 → OCR upload → confirms 28400 kWh
  → EmissionEntry(SCOPE2, STROM, 28400) inserted → closes browser

Session 2 (March — Erdgas):
  User opens app → GET / → Dashboard shows Strom ✓, rest Nicht erfasst
  Navigates to Screen 2 → OCR upload → confirms 4200 m³
  → EmissionEntry(SCOPE1, ERDGAS, 4200) inserted → closes browser

Session 3 (December — Scope 3):
  User opens app → GET / → Dashboard shows Strom ✓, Erdgas ✓, rest Nicht erfasst
  Completes Screens 5, 6, 7 → all Scope 3 entries inserted
  Navigates to Screen 3 (Fuhrpark) → CSV import → confirms Diesel + Benzin
  → Dashboard: all categories ✓ or Teilweise
  Clicks "Bericht erstellen" → PDF includes data quality note:
    "Heizöl: nicht erfasst, Flüssiggas: nicht erfasst"
```

---

## 7. Deployment View

### 7.1 Docker Compose Layout

```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - gruenbilanz_pgdata:/var/lib/postgresql/data
    depends_on:
      - tesseract
    environment:
      - DATABASE_URL=postgresql://gruenbilanz:gruenbilanz@localhost:5432/gruenbilanz
      - TESSERACT_URL=http://tesseract:3001
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1

  tesseract:
    build:
      context: ./docker/tesseract
    ports:
      - "3001:3001"

volumes:
  gruenbilanz_pgdata:
```

### 7.2 App Container — Multi-Stage Dockerfile

```
Stage 1: deps
  FROM node:20-alpine AS deps
  Install production npm dependencies

Stage 2: builder
  FROM node:20-alpine AS builder
  Copy source + deps
  Run prisma generate
  Run next build (output: standalone)

Stage 3: runner
  FROM node:20-alpine AS runner
  Install PostgreSQL 15 + supervisord
  Copy built Next.js (standalone output)
  Copy Prisma migrations
  Copy docker/init.sql
  Copy docker/supervisord.conf
  Copy docker/healthcheck.sh
  EXPOSE 3000
  CMD ["supervisord", "-c", "/etc/supervisord.conf"]
```

### 7.3 Supervisord Configuration

```ini
# docker/supervisord.conf

[supervisord]
nodaemon=true
logfile=/var/log/supervisord.log

[program:postgres]
command=docker-entrypoint.sh postgres
autorestart=true
priority=10
stdout_logfile=/var/log/postgres.log
stderr_logfile=/var/log/postgres.log

[program:nextjs-starter]
# Waits for Postgres to be ready, runs migrations, then starts Next.js
command=/docker/healthcheck.sh
priority=20
autorestart=false
startsecs=0
stdout_logfile=/var/log/nextjs-starter.log
stderr_logfile=/var/log/nextjs-starter.log
```

```bash
# docker/healthcheck.sh
#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U gruenbilanz; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Run Prisma migrations (idempotent)
npx prisma migrate deploy

# Start Next.js
exec node server.js
```

### 7.4 PostgreSQL Initialization

On first container start, PostgreSQL runs `docker/init.sql` automatically (placed in `/docker-entrypoint-initdb.d/`). This file contains:
- `CREATE DATABASE gruenbilanz` (if not exists)
- All table schemas (duplicating Prisma schema for bootstrap)
- All seed data: EmissionFactor rows (UBA 2024), CompanyProfile (Mustermann), IndustryBenchmark rows, and 2 full years of sample EmissionEntry + MaterialEntry rows

On subsequent starts, PostgreSQL detects the data directory already exists and skips `init.sql`. Prisma migrations (`prisma migrate deploy`) run on every start but are idempotent — already-applied migrations are skipped.

### 7.5 Tesseract Container

```dockerfile
# docker/tesseract/Dockerfile
FROM node:20-alpine
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-deu
WORKDIR /app
COPY package.json ./
RUN npm install express multer
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
```

The `server.js` is a minimal Express app:
- `POST /extract` — receives multipart PDF/image, calls `tesseract <file> stdout -l deu`, returns `{ text, confidence }`.

### 7.6 Environment Variables

All variables documented in `.env.example`:

```
# PostgreSQL connection (internal — both processes share localhost)
DATABASE_URL=postgresql://gruenbilanz:gruenbilanz@localhost:5432/gruenbilanz

# Tesseract OCR service URL (Docker service name)
TESSERACT_URL=http://tesseract:3001

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional: path where generated PDFs are stored inside container
REPORTS_PATH=/app/reports
```

---

## 8. Cross-cutting Concepts

### 8.1 CO₂e Calculation Engine (`lib/emissions.ts`)

All CO₂e calculations are centralised in `lib/emissions.ts`. No calculation logic exists in UI components or API routes.

```typescript
// Conceptual interface
function calculateCO2e(
  category: EmissionCategory | MaterialCategory,
  quantity: number,
  year: number,
  options?: { isOekostrom?: boolean }
): number {
  const factor = lookupFactor(category, year, options);
  return quantity * factor.factorKg; // returns kg CO₂e
}

function lookupFactor(
  key: string,
  year: number,
  options?: { isOekostrom?: boolean }
): EmissionFactor {
  // SELECT ... WHERE key = $key AND validYear <= $year ORDER BY validYear DESC LIMIT 1
  // Forward fallback: if no factor ≤ year, use earliest factor > year
  // Special case: STROM → use STROM_OEKOSTROM key if isOekostrom = true
}
```

**Unit note:** All quantities are stored in the DB as-entered (m³, L, kg, kWh, km). The emission factor carries the corresponding unit. The engine always produces kg CO₂e; the dashboard divides by 1000 to display tonnes CO₂e.

**Vehicle km handling:** If both litres (DIESEL_FUHRPARK) and km (PKW_DIESEL_KM) are entered, both calculate independently and are summed. No double-counting warning is shown.

**Kältemittel handling:** R410A, R32, R134A, and Sonstige refrigerant entries each have their own emission factor key. They are standard `EmissionEntry` rows with Scope 1 scope.

### 8.2 OCR Interface (`lib/ocr/index.ts`)

The OCR integration is implemented as a **stub behind a stable interface**:

```typescript
// lib/ocr/index.ts
export async function extractFromFile(
  file: File,
  category: string
): Promise<{ value: number; unit: string; confidence: number }>
```

The **current stub** simulates a 1–2 second processing delay and returns hardcoded values per category. It is designed to be replaced with a real implementation (e.g. a call to Claude claude-sonnet-4-20250514 with the document as base64, or the Tesseract HTTP service at `TESSERACT_URL`) without any changes to the wizard UI components.

### 8.3 Audit Trail

Every data-changing Server Action (`saveEntry`, `deleteEntry`, `saveMaterialEntry`, `saveCompanyProfile`) creates an immutable `AuditLog` row recording:
- `entityType` + `entityId` — which record changed
- `action` (CREATE / UPDATE / DELETE)
- `fieldName`, `oldValue`, `newValue` — field-level change
- `inputMethod` — MANUAL / OCR / CSV
- `documentId` — optional link to the source `UploadedDocument`

**Two UIs surface the audit log:**
1. `AuditLogPanel` on the dashboard — collapsible; shows the 50 most recent changes across all categories. Includes download links to source documents.
2. `ScreenChangeLog` at the bottom of each wizard screen — collapsible; shows the last 5 changes for that screen's categories. Helps users see what was previously entered.

### 8.4 Plausibility Warnings

`PlausibilityWarning` is a client-side component displayed inline under numeric input fields. It fires on `onBlur` using `getPlausibilityWarning(fieldKey, value)` from `lib/PlausibilityWarning.tsx`. It shows an amber banner when a value is statistically out of range for a Handwerksbetrieb (e.g. > 200,000 m³ Erdgas or < 1,000 kWh Strom). It does **not** block saving — it is informational only.

### 8.5 Error Handling

| Layer | Strategy |
|---|---|
| Server Actions | Return `{ success: false, error: string }` — never throw. Toast shown in German. |
| API Routes | Return HTTP 4xx/5xx with `{ error: string }` JSON body |
| OCR failures | Return `{ quantity: null, confidence: 0, error: "OCR fehlgeschlagen" }` — field stays empty, user enters manually |
| CSV parse errors | Return column preview with error rows highlighted; user can ignore or fix |
| PDF generation errors | Return 500 with toast "PDF-Erstellung fehlgeschlagen. Bitte erneut versuchen." |
| DB connection errors | Next.js error boundary catches; German error page shown |

### 8.6 Internationalisation

The app is **German-only**. No i18n framework is used. All strings are hardcoded in German in JSX components. Locale-aware formatting:
- Numbers: `Intl.NumberFormat('de-DE')` (1.234,56 format)
- Dates: `Intl.DateTimeFormat('de-DE')` (21.03.2026 format)

### 8.7 Accessibility

- All interactive elements ≥ 44×44 px touch target (mobile-first at 375 px)
- WCAG 2.1 AA colour contrast
- Semantic HTML5 (`<main>`, `<nav>`, `<section>`, `<table>`)
- Form labels explicitly associated via `htmlFor`
- Error messages linked via `aria-describedby`

### 8.8 Auto-Save Behaviour

Wizard fields trigger `onBlur` → Server Action → UPSERT to `EmissionEntry`. The "Speichern" button calls the same action explicitly. "Weiter" saves the current screen and navigates. No client-side state is required for persistence — the browser may be closed at any point.

### 8.9 Data Quality and Report Completeness

The PDF report always includes a **Data Quality Section** listing every `EmissionCategory` that has no entry for the reporting year, marked "nicht erfasst". Categories with entries are marked "erfasst (gemessen)" or "erfasst (geschätzt)" based on the `inputMethod` field. This meets the GHG Protocol requirement for transparent uncertainty disclosure.

The report also includes a **Berichtsgrenzen** (reporting boundaries) section rendered from `CompanyProfile.reportingBoundaryNotes` and `CompanyProfile.exclusions`. If these fields are empty, the section states "Keine besonderen Ausschlüsse oder Einschränkungen dokumentiert."

### 8.10 Security

- **No authentication** — intentional for single-tenant self-hosted deployment
- **File uploads** — MIME type and file size validated server-side before sending to Tesseract or parsing as CSV. Max upload size: 10 MB.
- **CSV injection prevention** — all CSV cell values are treated as numbers (parsed with `parseFloat`); no formula injection possible since output is numeric
- **No user-supplied strings are executed** — supplier name, memo, and boundary notes fields are stored as text and rendered with React (auto-escaped)
- **Environment variables** — `DATABASE_URL` and `TESSERACT_URL` are server-only; never exposed to the browser

---

## 9. Architecture Decisions

### ADR-001: Single App Container (PostgreSQL + Next.js) vs Separate Containers

**Status:** Accepted

**Context:**  
The deployment model requires Docker Compose. The choice is between co-locating PostgreSQL inside the `app` container (managed by supervisord) or running PostgreSQL as a separate third service.

**Options considered:**

**Option 1: Combined container (Next.js + PostgreSQL 15 in one image)**  
PostgreSQL and Next.js run as separate processes under supervisord inside one Docker image.

Pros:
- Simple `docker compose up` — only 2 services, matching the constraint exactly
- No network hop between app and database (localhost TCP)
- Single volume for data persistence
- Simple for non-technical operators

Cons:
- Violates "one process per container" Docker best practice
- Harder to scale (cannot scale app tier independently from DB)
- More complex Dockerfile

**Option 2: Separate `postgres` service (3 containers total)**  
Standard pattern: `app` + `postgres` + `tesseract`.

Pros:
- Follows Docker best practices
- Easier to upgrade PostgreSQL independently
- Standard pattern developers recognise

Cons:
- Contradicts the explicit constraint: **exactly 2 services only**
- Adds network complexity

**Decision:** Use **Option 1 — combined container** with supervisord.

**Rationale:** The constraint "exactly 2 services" is explicitly stated in the requirements. The deployment target is a single-server self-hosted scenario where operational simplicity outweighs Docker best practices. The localhost TCP connection avoids network latency.

**Consequences:**
- (+) Zero-config deployment for operators
- (+) Data stays in one volume
- (-) Cannot scale app horizontally (acceptable for single-tenant use case)
- (-) PostgreSQL and Next.js share container lifecycle

---

### ADR-002: Unified EmissionEntry Table vs Separate Tables per Scope

**Status:** Accepted

**Context:**  
Emission data covers Scope 1 (9 categories), Scope 2 (2 categories), and Scope 3 activities (8 categories). The design choice is between a single polymorphic table vs one table per scope.

**Options considered:**

**Option 1: Unified `EmissionEntry` table with scope + category discriminators**  
One table holds all entries. Scope and category are enum columns.

Pros:
- Single query for total CO₂e across all scopes
- Single UPSERT API for all wizard screens
- Dashboard aggregation is a simple GROUP BY scope
- Migrations easier — adding a category = adding an enum value

Cons:
- Enum values mix different scopes (less self-documenting)
- `@@unique([yearId, scope, category])` requires careful validation

**Option 2: Separate tables: `Scope1Entry`, `Scope2Entry`, `Scope3ActivityEntry`**  
Three tables with fixed columns matching each scope's categories.

Pros:
- Tables are self-documenting
- Foreign key constraints per category more explicit

Cons:
- Cross-scope total requires UNION or multiple queries
- Adding a category requires a schema migration (new column)
- Three separate UPSERT paths in the API

**Option 3: Separate table for materials only (hybrid)**  
`EmissionEntry` for Scope 1+2+3 activities; `MaterialEntry` for Scope 3 Category 1.

Pros:
- Correctly models the fundamental structural difference: fixed categories vs dynamic list

**Decision:** Use **Option 3 — hybrid**: `EmissionEntry` (unified, Scope 1/2/3 activities) + `MaterialEntry` (separate, Scope 3 materials).

**Rationale:** `EmissionEntry` with scope+category discriminator works perfectly for all fixed-category entries (always one value per category per year). `MaterialEntry` is a list — one year can have many rows for different materials. Merging these into one table would require nullable `materialCategory` columns alongside `emissionCategory`, which is error-prone.

**Consequences:**
- (+) Clean data model reflecting business reality
- (+) Aggregation: total CO₂e = SUM(EmissionEntry CO₂e) + SUM(MaterialEntry CO₂e)
- (-) Two separate data access patterns (one UPSERT for emissions, one append for materials)

---

### ADR-003: OCR/CSV Staging Area vs Direct Write to EmissionEntry

**Status:** Accepted

**Context:**  
When OCR or CSV produces a value, it must be shown to the user for confirmation before being saved as an authoritative entry. The question is whether to write directly to `EmissionEntry` with an "unconfirmed" flag, or use a separate staging table.

**Options considered:**

**Option 1: Direct write to EmissionEntry with `confirmed: Boolean` flag**  
Write the OCR/CSV value immediately; mark it unconfirmed. Confirm changes the flag.

Pros:
- Single table to query
- Simpler schema

Cons:
- Dashboard aggregation must exclude unconfirmed rows — adds complexity and risk of including wrong data
- If user navigates away without confirming, unconfirmed rows pollute the entry set
- Recalculation on dashboard could show wrong totals

**Option 2: Separate StagingEntry table**  
OCR/CSV results go to `StagingEntry`. User confirms → data moves to `EmissionEntry`. Staging entries expire after 24h.

Pros:
- `EmissionEntry` always contains only confirmed, authoritative data
- Dashboard query is simple: no need to filter by confirmation status
- Expired staging entries are easily cleaned up
- Clear audit trail: `inputMethod` column on `EmissionEntry` records origin

Cons:
- Additional table
- Confirmation step requires a two-step DB operation (delete staging + insert entry)

**Decision:** Use **Option 2 — StagingEntry staging table**.

**Rationale:** Data integrity is critical. `EmissionEntry` is the source of truth for all CO₂e calculations. Polluting it with unconfirmed OCR/CSV values risks incorrect reports. The additional table is a small schema cost for a significant correctness guarantee.

**Consequences:**
- (+) Dashboard always shows correct confirmed data
- (+) Clear separation between "candidate values" and "authoritative entries"
- (-) Two-step confirmation API
- (-) Cleanup job needed (or lazy cleanup on request)

---

### ADR-004: CSV Parsing — Server-side vs Client-side

**Status:** Accepted

**Context:**  
CSV/XLSX files uploaded by users need to be parsed and their columns mapped to emission categories. The parsing can happen in the browser (client-side JS) or on the server (API route).

**Options considered:**

**Option 1: Client-side CSV parsing (browser JS)**  
Parse the CSV in the browser using a library like PapaParse. Send the parsed data to the server for storage.

Pros:
- No file upload roundtrip for parsing
- Faster feedback (no network latency for preview)

Cons:
- CSV injection risk: malicious CSV formulas (e.g., `=CMD(...)`) could be executed if values are rendered in a spreadsheet context — mitigated by treating all values as numbers, but defence-in-depth favours server-side
- XLSX parsing is complex client-side
- Business logic (column validation, category matching) is duplicated or leaks to client

**Option 2: Server-side CSV parsing (API route)**  
Upload the file to `/api/csv`; server parses and returns first 5 rows + headers. Client shows mapping UI. User submits mapping; server applies it and returns values.

Pros:
- File contents never processed by untrusted client code
- All validation centralised
- XLSX and CSV handled identically
- No CSV injection risk

Cons:
- Two HTTP roundtrips (upload + apply mapping)
- Slightly higher latency for the preview

**Decision:** Use **Option 2 — server-side CSV parsing**.

**Rationale:** Security and correctness outweigh the latency cost. Centralising parsing logic on the server prevents business rule duplication. The two-roundtrip UX (preview + confirm) also aligns with the OCR confirmation pattern, keeping the UI consistent.

**Consequences:**
- (+) Secure: no untrusted execution of CSV content
- (+) Consistent with OCR staging pattern
- (-) Two HTTP calls per import operation

---

### ADR-005: PDF Generation — React-PDF vs Puppeteer vs pdfmake

**Status:** Accepted

**Context:**  
The application generates three PDF document types: GHG Protocol report, CSRD questionnaire, and (optionally) the Nachhaltigkeits-Badge. Generation must complete in < 3 seconds and run in a Node.js environment (not Edge runtime).

**Options considered:**

**Option 1: React-PDF (`@react-pdf/renderer`)**  
Renders a React component tree to a PDF buffer using a custom PDF renderer. Runs in Node.js.

Pros:
- Familiar JSX syntax; type-safe with TypeScript
- Pure Node.js — no Chromium, no headless browser
- Fast (< 1 second for typical reports)
- Fixed by the requirements specification

Cons:
- Limited CSS support (no Flexbox z-index, no CSS Grid)
- Complex tables require manual layout

**Option 2: Puppeteer / Playwright (headless Chrome)**  
Render HTML page to PDF via Chrome DevTools Protocol.

Pros:
- Full CSS support
- Pixel-perfect HTML rendering

Cons:
- Requires Chromium (100+ MB) inside the container
- Slower (2–5 seconds for page load + PDF conversion)
- Edge runtime incompatible
- Not permitted by requirements

**Option 3: pdfmake**  
JSON-based PDF definition language.

Pros:
- Lightweight
- Good table support

Cons:
- No JSX — requires separate template language
- Type safety limited
- Not permitted by requirements

**Decision:** Use **React-PDF** (`@react-pdf/renderer`).

**Rationale:** Explicitly required by the specification. Pure Node.js execution means no Chromium dependency, keeping the Docker image lean. JSX-based templates integrate naturally with the existing codebase. Performance requirement (< 3 seconds) is easily met.

**Consequences:**
- (+) No Chromium in production container
- (+) Type-safe PDF templates
- (+) Fast generation (< 1 second observed)
- (-) API route must specify `runtime = 'nodejs'` (not Edge)

---

### ADR-006: Emission Factor Versioning Strategy

**Status:** Accepted

**Context:**  
UBA emission factors are updated annually. Calculations for past years must use the factors valid in that year. Future factors must not retroactively change historical reports.

**Options considered:**

**Option 1: Hardcoded factors in application code**  
Factors as TypeScript constants.

Pros:
- No DB lookup needed

Cons:
- Cannot update without code deployment
- Cannot version per year
- Violates explicit requirement: "never hardcoded"

**Option 2: `valid_year` integer on each EmissionFactor row**  
Each factor row has a `validYear` integer. Lookup selects `MAX(validYear) WHERE validYear <= requestedYear`.

Pros:
- Simple to add new year's factors (INSERT new rows — existing rows untouched)
- Historical calculations are stable
- Easy to query: `WHERE key = $key AND validYear <= $year ORDER BY validYear DESC LIMIT 1`

Cons:
- If 2024 factors are used for a 2025 report (no 2025 data yet), old factors are silently used — acceptable, documented in methodology section

**Option 3: `valid_from` / `valid_to` date range**  
Each factor has `validFrom DATE` and `validTo DATE`.

Pros:
- Sub-year precision if factors change mid-year (not relevant for UBA annual updates)

Cons:
- Overly complex for annual updates
- Lookup SQL more complex
- No practical benefit for this use case

**Decision:** Use **Option 2 — `valid_year` integer**.

**Rationale:** UBA factors are published annually. The `valid_year <= requested_year` lookup is simple, correct, and stable. New year data is added without migrations — just INSERT. Historical reports are immutable.

**Consequences:**
- (+) Historical calculations always reproducible
- (+) Adding new year factors requires only data INSERT
- (+) PDF methodology section can state exact factor year used
- (-) If user enters 2025 data before 2025 factors are seeded, 2024 factors are silently used (acceptable; documented)

---

## 10. Quality Requirements

### 10.1 Quality Tree

```
Quality
├── Correctness
│   ├── CO₂e calculations match UBA factors exactly
│   ├── No double-counting across input methods
│   └── Historical calculations stable after factor updates
├── Usability
│   ├── One-shot annual entry completable in ≤ 20 min
│   ├── Short session (1 bill) completable in ≤ 5 min
│   └── German-language UI throughout
├── Reliability
│   ├── Partial data persists across browser sessions
│   ├── OCR failure degrades gracefully (manual entry still available)
│   └── No data loss on browser close
├── Performance
│   ├── PDF generation < 3 seconds
│   ├── Dashboard load < 2 seconds (including DB aggregation)
│   └── OCR response < 10 seconds
└── Portability
    ├── `docker compose up` produces working app on any Docker host
    └── No external cloud dependencies
```

### 10.2 Quality Scenarios

| ID | Quality | Stimulus | Response |
|---|---|---|---|
| Q1 | Correctness | User enters 1000 m³ Erdgas for 2024 | System calculates 2000 kg CO₂e using UBA 2024 factor 2.000 kg/m³ |
| Q2 | Correctness | UBA 2025 factors are seeded | 2024 reports remain unchanged; 2025 reports use new factors |
| Q3 | Usability | User uploads gas bill PDF | OCR pre-fills value within 10 seconds; user can override and save |
| Q4 | Reliability | User closes browser mid-session | On re-open, all previously saved values are present |
| Q5 | Performance | User clicks "Bericht erstellen" | PDF file available for download within 3 seconds |
| Q6 | Portability | New operator runs `docker compose up` | App reachable at `http://localhost:3000` with seed data visible |

---

## 11. Risks and Technical Debt

### 11.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OCR accuracy for German utility bills | Medium | Medium | Confidence indicator shown; manual override always available; OCR behind a replaceable interface |
| Tesseract container failure | Low | Medium | OCR upload button disabled when Tesseract unreachable; manual entry unaffected |
| PostgreSQL container crash during write | Low | High | Docker volume persists data; supervisord restarts PostgreSQL automatically |
| XLSX parsing (binary format) | Medium | Low | Use established library (e.g., `xlsx`/`exceljs`); validate strictly server-side |
| Emission factor accuracy | Low | High | UBA is the authoritative German source; methodology section in PDF cites source and year |
| User enters litres AND km for same vehicle type | Low | Low | Spec explicitly states: sum both, no warning needed |
| AuditLog table growth | Low | Low | Audit entries are append-only; archive old entries if table grows beyond ~100k rows |

### 11.2 Technical Debt

| Item | Description | Impact | Recommended resolution |
|---|---|---|---|
| Single-tenant architecture | No multi-tenancy; one installation = one company | Low (by design) | If multi-tenant is ever needed: major rearchitecture with auth + company isolation |
| Supervisord in container | Non-standard Docker pattern | Low | Acceptable for stated use case; document clearly |
| No authentication | Security relies entirely on network-level access control | Medium | If exposed to internet: add simple password/PIN protection or OAuth |
| Reports stored on container filesystem | PDFs written to container FS under `/app/reports` | Low | If container is rebuilt: volume-mount `/app/reports`; document in ops guide |
| No automated emission factor updates | Operator must manually seed new year's factors | Low | Add an admin page or CLI script for factor management |
| OCR is a stub | `lib/ocr/index.ts` returns hardcoded values; no real Tesseract/AI call | Medium | Replace stub body with real HTTP call to `TESSERACT_URL` or Claude API when ready |
| CSV import is a stub | `lib/csv/index.ts` returns hardcoded values; no real file parsing | Medium | Replace stub with `papaparse` / `exceljs` + column mapping logic |
| UploadedDocument.content in PostgreSQL | Binary file bytes stored in DB; may slow queries as storage grows | Low | Move to container volume or object storage if file count grows significantly |

---

## 12. Glossary

| Term | Definition |
|---|---|
| Berichtsjahr | Reporting year — the calendar year for which CO₂e is being calculated |
| Berichtsgrenzen | Reporting boundaries — defines what is included or excluded from the GHG inventory |
| Betriebsinhaber | Business owner — the primary user of GrünBilanz |
| Branche | Industry sector (e.g., Elektrohandwerk, SHK) |
| Branchenvergleich | Industry comparison — benchmark CO₂e values per sector |
| CO₂e | CO₂ equivalent — unit combining all greenhouse gases weighted by global warming potential |
| CSRD | Corporate Sustainability Reporting Directive — EU directive requiring sustainability reporting |
| DATEV | German accounting software widely used by Handwerksbetriebe; exports CSV data |
| EmissionCategory | Enum discriminator identifying a specific emission source (ERDGAS, STROM, etc.) |
| EmissionFactor | Multiplier converting a physical quantity (m³, L, kg, kWh, km) to kg CO₂e |
| Erdgas | Natural gas |
| Fahrtenbuch | Vehicle logbook recording km driven per vehicle |
| Fernwärme | District heating |
| FieldDocument | Per-field invoice/receipt attachment — one document per (fieldKey, year) |
| Firmenname | Company name |
| Flüssiggas | LPG (liquefied petroleum gas) |
| GHG Protocol | Greenhouse Gas Protocol — international standard for corporate CO₂ accounting |
| Großkunde | Large customer / client requiring supplier ESG data |
| Handwerksbetrieb | German craft / trade business (electrician, plumber, carpenter, etc.) |
| Heizöl | Heating oil |
| InputMethod | How data was entered: MANUAL, OCR, or CSV |
| Jahresabrechnung | Annual bill / settlement |
| Kältemittel | Refrigerant — HFC/HFO gases that leak from cooling and air-conditioning equipment |
| Kältemittelprotokoll | Refrigerant service log — records how much refrigerant was refilled per service |
| Lieferschein | Delivery receipt |
| Mitarbeiter | Employees / headcount |
| Nicht erfasst | Not recorded — category with no data entry for the year |
| OCR | Optical Character Recognition — used to extract numbers from utility bill PDFs |
| Ökostrom | Green electricity (certified renewable energy) |
| Pendlerverkehr | Employee commuting — km driven by employees to/from work |
| Scope 1 | Direct emissions from sources owned/controlled by the company |
| Scope 2 | Indirect emissions from purchased energy (electricity, district heating) |
| Scope 3 | All other indirect emissions (supply chain, travel, waste, purchased materials) |
| SHK | Sanitär, Heizung, Klima — plumbing, heating, air conditioning trade |
| Standort | Location (city and state) |
| Teilweise | Partially recorded — some but not all fields in a wizard screen are filled |
| UBA | Umweltbundesamt — German Federal Environment Agency; publishes official emission factors |
| Vollständig | Complete — all required fields in a wizard screen are filled |