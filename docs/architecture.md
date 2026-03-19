# GrünBilanz — Architektur-Dokumentation (arc42)

**Projekt:** GrünBilanz  
**Version:** 1.0  
**Stand:** 2026-03-19  
**Status:** Akzeptiert

---

## Über arc42

Dieses Dokument folgt dem [arc42-Template](https://arc42.org/) für Architekturdokumentation. arc42 ist ein praxiserprobtes Template für die Kommunikation und Dokumentation von Software-Architekturen.

---

## 1. Einführung und Ziele

### 1.1 Aufgabenstellung

GrünBilanz ist eine **Single-Tenant B2B-SaaS-Anwendung** zur CO₂-Fußabdruck-Berechnung und ESG-Berichterstattung für deutsche Handwerksbetriebe mit 10–100 Mitarbeitenden.

Das System ermöglicht es einem Betrieb:

- Emissionsdaten nach GHG-Protokoll (Scope 1, 2, 3) zu erfassen — manuell per Wizard oder via OCR-Upload von Belegen
- Den CO₂-Fußabdruck automatisch auf Basis aktueller Emissionsfaktoren (UBA 2024) zu berechnen
- GHG-konforme PDF-Berichte, Nachhaltigkeits-Badges und CSRD-Lieferantenfragebögen zu exportieren
- Jahres- und Quartalsverläufe sowie einen Branchenvergleich im Dashboard einzusehen

Die Anwendung öffnet direkt das Dashboard — ohne Login, ohne Benutzerverwaltung.

**Kernfunktionen:**

| Funktion | Beschreibung |
|----------|-------------|
| CO₂-Berechnung | Scope 1/2/3 nach GHG-Protokoll, Emissionsfaktoren aus DB |
| Dateneingabe | Manueller Wizard (Jahr/Quartal) + PDF/Bild-Upload mit OCR-Vorauffüllung |
| Dashboard | Scope-Aufschlüsselung, Jahr-für-Jahr-Trend, Branchenvergleich |
| PDF-Export | GHG-konformer Bericht (React-PDF, serverseitig) |
| Nachhaltigkeits-Badge | PNG-Download + HTML-Embed-Snippet |
| CSRD-Fragebogen | Vorausgefüllte Lieferanten-PDF, Ein-Klick-Export |

### 1.2 Qualitätsziele

| Priorität | Qualitätsziel | Szenario |
|-----------|--------------|----------|
| 1 | **Korrektheit** | Emissionsberechnungen liefern exakte Ergebnisse basierend auf den hinterlegten UBA-Faktoren; falsche Faktoren führen zu Fehlkalkulationen. |
| 2 | **Betriebsbereitschaft** | `docker compose up` startet eine vollständig funktionsfähige Anwendung inklusive Schema und Seed-Daten; kein manueller Setup-Schritt erforderlich. |
| 3 | **Leistung** | PDF-Generierung schließt in unter 3 Sekunden ab; Dashboard-Seitenladezeit < 2 Sekunden. |
| 4 | **Wartbarkeit** | Emissionsfaktoren werden ausschließlich in der Datenbank gepflegt und sind ohne Code-Änderung aktualisierbar. |
| 5 | **Zugänglichkeit** | Vollständige Bedienbarkeit auf mobilen Geräten ab 375 px Viewport-Breite. |

### 1.3 Stakeholder

| Rolle | Erwartungen | Bedenken |
|-------|------------|---------|
| **Handwerksbetrieb (Eigentümer)** | Einfache Bedienung, verständliche Berichte, CSRD-Konformität | Korrektheit der Berechnungen, Datenschutz |
| **Buchhalter / Office-Manager** | Schnelle Dateneingabe per OCR, Fehlertoleranz | Aufwand bei manueller Nachkorrektur |
| **Entwicklungsteam** | Klare Architektur, lokale Entwicklungsumgebung via Docker | Komplexität OCR-Integration, Performance PDF-Generierung |
| **Betreiber / DevOps** | Einfaches Deployment via Docker Compose | Datenbankmigrationen, Backup-Strategie |

---

## 2. Randbedingungen

### 2.1 Technische Randbedingungen

| Randbedingung | Hintergrund / Motivation |
|---------------|-------------------------|
| **Next.js 14 (App Router)** | Festgelegt; ermöglicht Server Components, Server Actions und API Routes in einem Framework |
| **TypeScript (strict mode)** | Festgelegt; Typsicherheit reduziert Laufzeitfehler bei komplexen Berechnungslogiken |
| **Tailwind CSS** | Festgelegt; utility-first für schnelle, konsistente Gestaltung |
| **PostgreSQL 15 in Docker** | Festgelegt; kein Supabase, keine Cloud-Datenbank |
| **Prisma ORM** | Festgelegt; typsicherer DB-Zugriff, Migrations-Management |
| **Tesseract OCR als separater Docker-Container** | Festgelegt; isoliert rechenintensive OCR vom Hauptprozess |
| **React-PDF (serverseitig, Node.js Runtime)** | Festgelegt; PDF-Generierung ohne Browser-Dependency |
| **Docker Compose (alle Services)** | Festgelegt; lokales Deployment ohne Kubernetes |
| **Keine Authentifizierung** | Festgelegt; Single-Tenant-Betrieb, App öffnet direkt Dashboard |
| **Kein Supabase (keine Exceptions)** | Festgelegt; kein Supabase Auth, Storage, Realtime oder RLS |
| **Keine Zahlungsverarbeitung** | Festgelegt; kein Stripe oder ähnliches |

### 2.2 Organisatorische Randbedingungen

| Randbedingung | Hintergrund / Motivation |
|---------------|-------------------------|
| **Deutschsprachige Benutzeroberfläche** | Zielgruppe sind deutsche Handwerksbetriebe |
| **Mobile-First (375 px)** | Viele Handwerker nutzen primär Smartphones |
| **Alle Emissionsfaktoren in der DB** | Aktualisierbarkeit ohne Code-Release; regulatorische Änderungen (UBA-Faktoren) |
| **`docker compose up` → voll funktionsfähig** | Kein manueller Einrichtungsschritt; niedrige Einstiegshürde |
| **`.env.example` bereitstellen** | Onboarding neuer Entwickler ohne Trial-and-Error |

### 2.3 Konventionen

| Konvention | Beschreibung |
|------------|-------------|
| **TypeScript Coding Standards** | Strict mode, ESLint + Prettier, Husky-Pre-commit-Hooks |
| **Git-Workflow** | Feature-Branches von `main`, Conventional Commits |
| **Dokumentation** | Markdown in `docs/`, ADRs für Entscheidungen |
| **Datenbankzugriff** | Ausschließlich Prisma — kein Raw SQL |
| **Emissionsfaktoren** | Niemals hartcodiert in Anwendungscode |

---

## 3. Kontextabgrenzung

### 3.1 Fachlicher Kontext

```mermaid
C4Context
    title Systemkontextdiagramm — GrünBilanz

    Person(owner, "Betriebsinhaber / Office-Manager", "Gibt Verbrauchsdaten ein, lädt Belege hoch, exportiert Berichte")

    System(gruenbilanz, "GrünBilanz", "CO₂-Fußabdruck-Berechnung und ESG-Berichterstattung für Handwerksbetriebe")

    System_Ext(uba, "UBA Emissionsfaktoren", "Externe Quelle; Faktoren werden manuell als Seed-Daten in DB übernommen")
    System_Ext(pdf_viewer, "PDF-Viewer (Browser / OS)", "Empfängt generierte PDF-Dokumente")
    System_Ext(browser, "Webbrowser", "Zeigt Dashboard und Eingabeformulare an")

    Rel(owner, gruenbilanz, "Bedient", "HTTPS / Browser")
    Rel(owner, pdf_viewer, "Öffnet exportierte PDFs")
    Rel(gruenbilanz, uba, "Emissionsfaktoren (manuell übernommen als Seed-Daten)")
    Rel(gruenbilanz, browser, "Liefert HTML/JS", "HTTPS")
```

**Kommunikationspartner:**

| Partner | Eingabe | Ausgabe |
|---------|---------|---------|
| Betriebsinhaber / Office-Manager | Verbrauchsdaten (manuell), PDF/Bild-Uploads | Dashboard, PDF-Berichte, Badges, CSRD-PDF |
| UBA Emissionsfaktoren | — (externe Quelle, manuell als DB-Seed übernommen) | Emissionsfaktoren nach Jahr und Kategorie |

### 3.2 Technischer Kontext

```mermaid
C4Context
    title Technischer Kontext — GrünBilanz

    Person(user, "Benutzer (Browser)")

    System_Boundary(dc, "Docker Compose Stack") {
        System(app, "app", "Next.js 14 Anwendung\n(Port 3000)")
        System(postgres, "postgres", "PostgreSQL 15\n(Port 5432)")
        System(tesseract, "tesseract", "Tesseract OCR Service\n(Port 3001)")
    }

    Rel(user, app, "HTTP/HTTPS", "Port 3000")
    Rel(app, postgres, "Prisma / SQL", "Port 5432")
    Rel(app, tesseract, "HTTP POST (multipart)", "Port 3001")
```

**Technische Schnittstellen:**

| Schnittstelle | Beschreibung | Protokoll / Format |
|---------------|-------------|-------------------|
| Browser → App | Seitenaufrufe, Formulare, File-Uploads | HTTPS, HTML/JSON |
| App → PostgreSQL | Alle Datenbankoperationen | Prisma Client / TCP (SQL) |
| App → Tesseract | OCR-Anfragen mit PDF/Bild | HTTP POST, `multipart/form-data` → JSON |
| App → Client (PDF) | PDF-Stream aus React-PDF | HTTP Response, `application/pdf` |

---

## 4. Lösungsstrategie

**Grundlegende Entscheidungen und Lösungsansätze zur Erreichung der Qualitätsziele:**

| Qualitätsziel | Ansatz | Begründung |
|---------------|--------|-----------|
| **Korrektheit** | Emissionsfaktoren ausschließlich in DB (versioniert nach Jahr) | Keine Hartcodierung; Faktoren sind auditierbar und aktualisierbar ohne Code-Deployment |
| **Betriebsbereitschaft** | Docker Compose mit Init-Container für Schema + Seed | Einziger Befehl genügt; Prisma-Migrations laufen automatisch beim App-Start |
| **Leistung (PDF < 3 s)** | Serverseitige PDF-Generierung mit React-PDF in Node.js Runtime | Kein Browser-Rendering; direkte Stream-Ausgabe; Tesseract OCR synchron (kein Vercel-Timeout) |
| **Wartbarkeit** | Prisma-Schema mit expliziten Modellen pro Scope; Seed-Skript für UBA-Faktoren | Klare Struktur; Migrationen versioniert; neue Faktoren ohne Code-Änderung |
| **Zugänglichkeit** | Tailwind CSS Mobile-First Breakpoints; 375 px als Default-Viewport | Primärer Nutzerkontext: Smartphone im Büro oder auf Baustelle |

**Technologie-Entscheidungen:**

- **Next.js 14 App Router** — Server Components für Dashboard und Berichte; Server Actions für Dateneingabe
- **PostgreSQL 15 + Prisma** — Relational für versionierte Emissionsfaktoren und Eingabedaten; Prisma für typsichere Abfragen
- **Tesseract OCR als separater Docker-Service** — Isolation von CPU-intensiver Verarbeitung; synchrone HTTP-Kommunikation ausreichend (keine Serverless-Constraints)
- **React-PDF** — Deklarative PDF-Definition in React; Node.js-kompatibel; keine Headless-Browser-Abhängigkeit
- **Keine Authentifizierung** — Single-Tenant; App läuft lokal in Docker; Sicherheitsperimeter ist das Netzwerk

**Architekturmuster:**

- **Layered Architecture**: UI (React/Next.js) → Server Actions / API Routes → Service-Layer → Prisma → PostgreSQL
- **Database-as-Configuration**: Emissionsfaktoren und Benchmark-Daten im DB-Seed; konfigurierbar ohne Code-Änderung
- **Synchrones OCR-Pipeline-Muster**: Upload → HTTP an Tesseract → Text zurück → Formular vorauffüllen (kein Message Queue nötig)

---

## 5. Bausteinsicht

### 5.1 Ebene 1: Systemübersicht

```mermaid
C4Container
    title Container-Diagramm — GrünBilanz

    Person(user, "Benutzer")

    System_Boundary(dc, "Docker Compose Stack") {
        Container(app, "Next.js App", "Next.js 14 / TypeScript / Tailwind", "Präsentation, Geschäftslogik, API, PDF-Generierung")
        ContainerDb(db, "PostgreSQL 15", "PostgreSQL", "Emissionsdaten, Eingaben, Faktoren, Benchmarks")
        Container(ocr, "Tesseract OCR Service", "Node.js / Tesseract.js", "OCR-Verarbeitung von PDFs und Bildern")
    }

    Rel(user, app, "Nutzt", "HTTP :3000")
    Rel(app, db, "Liest/Schreibt", "Prisma / TCP :5432")
    Rel(app, ocr, "Sendet Dokument", "HTTP POST :3001")
```

**Container:**

| Container | Verantwortlichkeit | Schnittstellen |
|-----------|-------------------|----------------|
| **Next.js App** | UI-Rendering, Dateneingabe, Berechnungslogik, PDF-/Badge-Export, CSRD-PDF | HTTP :3000, Prisma, HTTP :3001 |
| **PostgreSQL 15** | Persistenz für alle Geschäftsdaten (Eingaben, Emissionsfaktoren, Benchmarks) | TCP :5432 |
| **Tesseract OCR Service** | OCR-Verarbeitung von hochgeladenen PDFs und Bildern | HTTP :3001 (REST) |

### 5.2 Ebene 2: Next.js App — Interne Struktur

```mermaid
graph TD
    subgraph "src/app (App Router)"
        PG_DASH["/dashboard — Seite"]
        PG_INPUT["/input — Dateneingabe-Wizard"]
        PG_REPORT["/api/report — PDF-Route"]
        PG_BADGE["/api/badge — Badge-Route"]
        PG_OCR["/api/ocr — OCR-Route"]
        PG_CSRD["/api/csrd — CSRD-PDF-Route"]
    end

    subgraph "src/lib"
        CALC[emissionCalc.ts\nBerechnungslogik]
        FACTORS[emissionFactors.ts\nFaktorabruf aus DB]
        PRISMA[prisma.ts\nPrisma-Client-Singleton]
        PDF_LIB[pdf/\nReact-PDF-Komponenten]
    end

    subgraph "src/components"
        WIZARD[InputWizard\nStep-by-Step-Formular]
        DASH_CMP[DashboardCharts\nDiagramme]
        SCOPE_CMP[ScopeXForm\nEingabe je Scope]
    end

    PG_DASH --> CALC
    PG_DASH --> FACTORS
    PG_INPUT --> WIZARD
    PG_INPUT --> SCOPE_CMP
    PG_REPORT --> PDF_LIB
    PG_BADGE --> PDF_LIB
    PG_OCR --> CALC
    PG_CSRD --> PDF_LIB
    CALC --> FACTORS
    FACTORS --> PRISMA
    WIZARD --> SCOPE_CMP
```

**Module:**

| Modul | Verantwortlichkeit |
|-------|-------------------|
| `src/app/dashboard/` | Dashboard-Seite: Scope-Breakdown, Trends, Branchenvergleich |
| `src/app/input/` | Dateneingabe-Wizard (manuell + OCR-Upload) |
| `src/app/api/report/` | PDF-Report-Generierung (React-PDF, Node.js Runtime) |
| `src/app/api/badge/` | Nachhaltigkeits-Badge (PNG + HTML-Snippet) |
| `src/app/api/ocr/` | OCR-Proxy: Empfang Upload → Weiterleitung an Tesseract → Rückgabe extrahierter Werte |
| `src/app/api/csrd/` | CSRD-Lieferantenfragebogen PDF-Generierung |
| `src/lib/emissionCalc.ts` | Berechnungslogik: Verbrauch × Emissionsfaktor = CO₂e |
| `src/lib/emissionFactors.ts` | Abruf der versionierten Emissionsfaktoren aus PostgreSQL |
| `src/lib/prisma.ts` | Prisma-Client-Singleton (verhindert Connection-Overflows in Dev) |
| `src/lib/pdf/` | React-PDF-Layoutkomponenten für Report, Badge, CSRD |
| `src/components/` | Wiederverwendbare UI-Komponenten (Wizard, Charts, Formulare) |

---

## 6. Laufzeitsicht

### 6.1 Szenario: Manuelle Dateneingabe

```mermaid
sequenceDiagram
    actor Benutzer
    participant Browser
    participant NextApp as Next.js App<br/>(Server Action)
    participant DB as PostgreSQL

    Benutzer->>Browser: Öffnet /input, wählt Jahr/Quartal
    Browser->>NextApp: GET /input
    NextApp->>DB: Lade Eingabeperioden und Vorjahreswerte
    DB-->>NextApp: Daten
    NextApp-->>Browser: Wizard-Seite (SSR)

    loop Für jeden Scope-Schritt
        Benutzer->>Browser: Füllt Scope-1/2/3-Felder aus
        Browser->>NextApp: Server Action (submitScopeData)
        NextApp->>DB: INSERT/UPDATE EmissionEntry
        DB-->>NextApp: Bestätigung
        NextApp-->>Browser: Nächster Schritt / Validierungsfehler
    end

    Benutzer->>Browser: Abschluss Wizard
    NextApp->>DB: Berechne Gesamtemissionen (Emissionsfaktoren × Mengen)
    DB-->>NextApp: Faktoren
    NextApp-->>Browser: Redirect → Dashboard
```

### 6.2 Szenario: OCR-Upload und Formular-Vorauffüllung

```mermaid
sequenceDiagram
    actor Benutzer
    participant Browser
    participant NextApp as Next.js App<br/>(/api/ocr Route)
    participant Tesseract as Tesseract OCR<br/>(Docker :3001)
    participant DB as PostgreSQL

    Benutzer->>Browser: Lädt PDF/Bild hoch
    Browser->>NextApp: POST /api/ocr (multipart/form-data)
    NextApp->>Tesseract: POST /ocr (multipart, Dokument)
    Note over NextApp,Tesseract: Synchron — kein Timeout-Problem<br/>da kein Serverless
    Tesseract-->>NextApp: Extrahierter Text (JSON)
    NextApp->>NextApp: Parse Text → strukturierte Felder<br/>(Regex / Pattern-Matching)
    NextApp-->>Browser: Vorausgefüllte Formularfelder (JSON)
    Browser->>Benutzer: Wizard mit vorausgefüllten Werten anzeigen
    Note over Benutzer: Prüft und korrigiert Felder
    Benutzer->>Browser: Speichert korrigierte Eingabe
    Browser->>NextApp: Server Action (submitScopeData)
    NextApp->>DB: INSERT EmissionEntry
```

### 6.3 Szenario: PDF-Report-Generierung

```mermaid
sequenceDiagram
    actor Benutzer
    participant Browser
    participant NextApp as Next.js App<br/>(/api/report Route)
    participant DB as PostgreSQL

    Benutzer->>Browser: Klickt "PDF-Report exportieren"
    Browser->>NextApp: GET /api/report?year=2024
    NextApp->>DB: Lade Emissionsdaten und -faktoren (Jahr)
    DB-->>NextApp: Aggregierte Scope-1/2/3-Daten
    NextApp->>NextApp: Rendere React-PDF-Komponenten<br/>(serverseitig, Node.js Runtime)
    Note over NextApp: Ziel: < 3 Sekunden
    NextApp-->>Browser: PDF-Stream (application/pdf)
    Browser->>Benutzer: PDF wird im Browser geöffnet / heruntergeladen
```

### 6.4 Szenario: Anwendungsstart via Docker Compose

```mermaid
sequenceDiagram
    participant DC as docker compose up
    participant PG as postgres Container
    participant App as app Container
    participant OCR as tesseract Container

    DC->>PG: Startet PostgreSQL 15
    PG-->>DC: Bereit (healthcheck)
    DC->>App: Startet Next.js App (depends_on: postgres healthy)
    App->>PG: Prisma migrate deploy
    PG-->>App: Schema angewendet
    App->>PG: Prisma db seed (Emissionsfaktoren UBA 2024, Benchmarks)
    PG-->>App: Seed abgeschlossen
    App-->>DC: Bereit auf :3000
    DC->>OCR: Startet Tesseract OCR Service
    OCR-->>DC: Bereit auf :3001
    Note over DC: Alle Services laufen — App voll funktionsfähig
```

---

## 7. Verteilungssicht

### 7.1 Docker Compose Infrastruktur

```mermaid
graph TB
    subgraph "Host-Rechner (Developer / Server)"
        subgraph "docker-compose.yml"
            subgraph "app — Next.js (Port 3000)"
                NEXT[Next.js 14\nNode.js Runtime]
                PRISMA_C[Prisma Client]
                REACT_PDF[React-PDF]
            end
            subgraph "postgres — PostgreSQL 15 (Port 5432)"
                PG[(PostgreSQL 15\nVolume: pg_data)]
            end
            subgraph "tesseract — OCR Service (Port 3001)"
                TESS[Tesseract.js\nREST-Wrapper]
            end
        end
        VOL[(pg_data\nDocker Volume)]
    end

    NEXT -->|Prisma / SQL| PG
    NEXT -->|HTTP POST| TESS
    PG --- VOL
    Browser([Browser :3000]) --> NEXT
```

### 7.2 Docker Compose Services

```yaml
# docker-compose.yml — Konzeptuelle Übersicht
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready
    ports: ["5432:5432"]

  app:
    build: .
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      DATABASE_URL, TESSERACT_URL
    ports: ["3000:3000"]
    command: |
      prisma migrate deploy &&
      prisma db seed &&
      next start

  tesseract:
    build: ./tesseract
    ports: ["3001:3001"]

volumes:
  pg_data:
```

**Service-Kommunikation:**

| Von | Nach | Protokoll | Anmerkung |
|-----|------|-----------|-----------|
| `app` | `postgres` | TCP :5432 (SQL) | Via Docker-internes Netzwerk; Service-Name `postgres` als Hostname |
| `app` | `tesseract` | HTTP :3001 | Via Docker-internes Netzwerk; `TESSERACT_URL=http://tesseract:3001` |
| Host / Browser | `app` | HTTP :3000 | Einziger nach außen exponierter Port |

### 7.3 Umgebungen

| Umgebung | Zweck | Konfiguration |
|----------|-------|---------------|
| **Entwicklung** | Lokale Entwicklung | `docker compose up --build`; `.env.local` aus `.env.example` |
| **Produktion** | Produktivbetrieb | `docker compose up -d`; Umgebungsvariablen über `.env` oder Secrets |

**Erforderliche Umgebungsvariablen (`.env.example`):**

```env
# Datenbank
DATABASE_URL=postgresql://gruenbilanz:gruenbilanz@postgres:5432/gruenbilanz

# OCR Service
TESSERACT_URL=http://tesseract:3001

# Next.js
NODE_ENV=production
```

---

## 8. Querschnittliche Konzepte

### 8.1 Domänenmodell

Das Domänenmodell spiegelt das GHG-Protokoll direkt wider.

```mermaid
erDiagram
    Company {
        int id PK
        string name
        string industry
        string location
        int employeeCount
    }

    ReportingPeriod {
        int id PK
        int year
        string quarter "Q1|Q2|Q3|Q4|ANNUAL"
        datetime createdAt
    }

    EmissionEntry {
        int id PK
        int reportingPeriodId FK
        string scope "SCOPE1|SCOPE2|SCOPE3"
        string category
        string subcategory
        decimal quantity
        string unit
        decimal co2e
        string sourceType "MANUAL|OCR"
        datetime createdAt
    }

    EmissionFactor {
        int id PK
        int year
        string category
        string subcategory
        decimal factorKgCo2ePerUnit
        string unit
        string source "UBA_2024"
        datetime validFrom
    }

    IndustryBenchmark {
        int id PK
        string industry
        int year
        decimal avgScope1Co2e
        decimal avgScope2Co2e
        decimal avgScope3Co2e
        int employeeCount
    }

    Company ||--o{ ReportingPeriod : "hat"
    ReportingPeriod ||--o{ EmissionEntry : "enthält"
    EmissionEntry }o--|| EmissionFactor : "nutzt"
    Company ||--o{ IndustryBenchmark : "vergleicht mit"
```

**Prisma-Schema-Design (Schlüsselpunkte):**

- **`EmissionEntry`** ist das zentrale Faktum: eine Zeile pro Kategorie/Subkategorie/Periode. Dadurch sind beliebig viele Scope-3-Kategorien erweiterbar ohne Schema-Änderung.
- **`EmissionFactor`** ist nach `year` versioniert. Abfragen nutzen immer den Faktor des Erfassungsjahres.
- **`co2e`** in `EmissionEntry` wird bei der Eingabe berechnet und gespeichert (`quantity × factor`). Historische Berechnungen bleiben damit auch nach Faktor-Updates stabil (der ursprüngliche Faktor ist im `EmissionFactor` mit `year` erhalten).
- **`sourceType`** unterscheidet manuelle Eingaben von OCR-präzisierten Daten für Audit-Zwecke.

### 8.2 Emissionsfaktor-Versionierungsstrategie

**Entscheidung: Jahresbasierte Versionierung in der Datenbank**

Emissionsfaktoren werden per `(year, category, subcategory)` identifiziert. Bei Eingabe wird immer der Faktor des entsprechenden Erfassungsjahres herangezogen.

```sql
-- Konzeptuelle Abfrage (über Prisma)
SELECT factor_kg_co2e_per_unit
FROM emission_factors
WHERE year = :reportingYear
  AND category = :category
  AND subcategory = :subcategory
ORDER BY valid_from DESC
LIMIT 1;
```

**Vorteile:**
- Historische Reports bleiben korrekt, da gespeicherter `co2e`-Wert den damaligen Faktor widerspiegelt
- Neue UBA-Faktoren können per SQL-Insert hinzugefügt werden, ohne Code zu ändern
- Vollständige Audit-Spur: welcher Faktor für welches Jahr galt

**Konsequenz:** Beim Update von Faktoren für ein vergangenes Jahr werden bestehende `EmissionEntry.co2e`-Werte **nicht** automatisch neu berechnet. Eine optionale "Neu berechnen"-Funktion kann separat implementiert werden.

### 8.3 OCR-Pipeline-Design

**Entscheidung: Synchrone HTTP-Kommunikation App → Tesseract**

Da die Anwendung in Docker läuft (kein Serverless, kein Vercel-Timeout), ist eine synchrone OCR-Pipeline ausreichend und einfacher:

```
Browser → POST /api/ocr → app Container → POST http://tesseract:3001/ocr → Tesseract
                                                                              ↓
Browser ← vorausgefüllte Felder ← JSON-Response ←────────────────── Extrahierter Text
```

- **Kein Message Queue** (kein RabbitMQ, kein BullMQ) — reduziert Komplexität erheblich
- **Kein Background-Job-Polling** — Benutzer wartet synchron (~2–10 Sek. je nach Dokumentgröße)
- **Loading-State** im Frontend signalisiert Verarbeitungsfortschritt
- **Tesseract-Service** ist ein schlanker Node.js-REST-Wrapper: empfängt `multipart/form-data`, ruft `tesseract.js` (oder `tesseract-ocr` Binary) auf, gibt strukturierten JSON zurück

### 8.4 Sicherheit

Da die Anwendung Single-Tenant ohne Authentifizierung ist, liegt der Sicherheitsperimeter beim Netzwerkzugang:

- **Kein öffentliches Deployment ohne Reverse-Proxy**: Im Produktivbetrieb sollte ein Nginx/Traefik vorgeschaltet sein
- **Nur Port 3000 extern exponieren**: PostgreSQL (:5432) und Tesseract (:3001) bleiben Docker-intern
- **Eingabevalidierung**: Zod-Schemas für alle Server Actions und API Routes
- **SQL-Injection-Schutz**: Ausschließlich Prisma (parametrisierte Abfragen), kein Raw SQL
- **File-Upload-Validierung**: MIME-Type und Dateigröße bei `/api/ocr` prüfen
- **Umgebungsvariablen**: Keine Geheimnisse im Image; via `.env`-Datei oder Docker-Secrets injiziert

### 8.5 Fehlerbehandlung

| Bereich | Strategie |
|---------|-----------|
| **Server Actions** | `try/catch`; Fehlerobjekt an Client zurückgeben; kein unbehandelter `throw` |
| **API Routes** | HTTP-Statuscodes (400/422/500); JSON-Fehlerobjekt `{ error: string, details?: ... }` |
| **OCR-Fehler** | Bei Tesseract-Fehler: Formular leer öffnen mit Hinweis "OCR fehlgeschlagen, bitte manuell ausfüllen" |
| **DB-Fehler** | Prisma-Fehler loggen; generische Fehlermeldung an Benutzer; keine DB-Details exponieren |
| **Logging** | `console.error` serverseitig (Docker-Log-Output); strukturiertes Format für Produktionslog-Aggregation |

### 8.6 Testing-Strategie

| Ebene | Werkzeug | Schwerpunkt |
|-------|----------|------------|
| **Unit Tests** | Vitest | `emissionCalc.ts` (Berechnungslogik mit bekannten Faktoren), Zod-Schemas |
| **Integration Tests** | Vitest + Prisma (Test-DB) | CRUD für `EmissionEntry`, Faktorabfragen |
| **E2E Tests** | Playwright | Dateneingabe-Wizard, PDF-Download, OCR-Upload-Flow |
| **Coverage-Ziel** | — | > 80 % für Berechnungslogik und Datenmodell |

### 8.7 Konfigurationsverwaltung

- **Alle Konfiguration via Umgebungsvariablen** (Docker Compose `environment` oder `.env`-Datei)
- **`.env.example`** mit allen erforderlichen Variablen und Beispielwerten im Repository
- **Keine Geheimnisse im Quellcode** oder Docker-Image
- **Emissionsfaktoren** sind Daten (nicht Konfiguration): im DB-Seed verwaltet, per SQL-Migration aktualisierbar

---

## 9. Architekturentscheidungen

### Entscheidungsübersicht

| ADR | Titel | Status |
|-----|-------|--------|
| [ADR-001](#adr-001-ocr-pipeline-synchron-vs-asynchron) | OCR-Pipeline: Synchron vs. Asynchron | Akzeptiert |
| [ADR-002](#adr-002-emissionsfaktor-versionierungsstrategie) | Emissionsfaktor-Versionierungsstrategie | Akzeptiert |
| [ADR-003](#adr-003-prisma-schema-design-fuer-multi-scope-dateneingabe) | Prisma-Schema-Design für Multi-Scope-Dateneingabe | Akzeptiert |
| [ADR-004](#adr-004-pdf-generierung-react-pdf-serverseitig) | PDF-Generierung: React-PDF serverseitig | Akzeptiert |
| [ADR-005](#adr-005-keine-authentifizierung-single-tenant) | Keine Authentifizierung — Single-Tenant | Akzeptiert |

---

### ADR-001: OCR-Pipeline: Synchron vs. Asynchron

**Status:** Akzeptiert

**Kontext:**  
Benutzer laden PDFs oder Bilder hoch, die per OCR verarbeitet werden, um Formularfelder vorauszufüllen. Es muss entschieden werden, ob die Verarbeitung synchron (Request-Response) oder asynchron (Job Queue + Polling) erfolgt.

**Optionen:**

#### Option 1: Synchrone HTTP-Pipeline (empfohlen)

App leitet den Upload direkt per HTTP POST an den Tesseract-Service weiter und wartet auf die Antwort.

**Vorteile:**
- Einfache Implementierung (kein Queue-System)
- Keine zusätzliche Infrastruktur (kein Redis/BullMQ)
- Sofortiges Feedback im Browser mit Loading-State
- Ausreichend, da kein Serverless-Timeout-Problem

**Nachteile:**
- Browser-Request offen während OCR-Verarbeitung (~2–10 s)
- Bei sehr großen Dokumenten potenziell lange Wartezeit

#### Option 2: Asynchrone Queue (Job-Pattern)

Upload in Queue; Polling oder WebSocket für Status.

**Vorteile:**
- Skalierbar für viele gleichzeitige Uploads
- Keine langen HTTP-Verbindungen

**Nachteile:**
- Erheblich mehr Komplexität (BullMQ, Redis, Polling-API oder WebSocket)
- Single-User-App: keine gleichzeitigen Uploads zu erwarten
- Nicht gerechtfertigt für Single-Tenant-Betrieb

#### Option 3: Direkter Tesseract-Aufruf im App-Container

Tesseract-Bibliothek direkt im Next.js-Prozess laden.

**Vorteile:**
- Kein separater Service, weniger Docker-Overhead

**Nachteile:**
- CPU-intensive OCR blockiert den Node.js-Event-Loop
- Next.js-App wird während OCR unresponsive
- Isolation von Laufzeitabhängigkeiten geht verloren

**Entscheidung:** **Option 1 — Synchrone HTTP-Pipeline**

**Begründung:** Die Anwendung läuft in Docker ohne Serverless-Timeout-Beschränkungen. Single-Tenant-Betrieb bedeutet kein gleichzeitiges Upload-Szenario. Synchron ist erheblich einfacher und wartbarer. Die Benutzererfahrung ist akzeptabel mit einem klaren Loading-Indikator.

---

### ADR-002: Emissionsfaktor-Versionierungsstrategie

**Status:** Akzeptiert

**Kontext:**  
Emissionsfaktoren (UBA 2024) müssen in der Datenbank gespeichert und versioniert werden. Historische Berichte müssen reproduzierbar bleiben.

**Optionen:**

#### Option 1: Jahresbasierte Versionierung mit gespeichertem CO₂e-Wert (empfohlen)

`EmissionFactor(year, category, subcategory, factor)` + `EmissionEntry.co2e` wird bei Eingabe berechnet und gespeichert.

**Vorteile:**
- Historische Reports stabil (gespeicherter Wert ändert sich nicht bei Faktor-Update)
- Einfache Abfrage: `WHERE year = :reportYear`
- Neue Faktoren per SQL-INSERT ohne Code-Änderung

**Nachteile:**
- Bei Faktor-Korrekturen müssen alte `EmissionEntry`-Einträge manuell neu berechnet werden

#### Option 2: Nur Faktoren speichern, CO₂e immer on-the-fly berechnen

`EmissionEntry` speichert nur Rohmengen; CO₂e wird bei Abfrage berechnet.

**Vorteile:**
- Faktor-Updates wirken sofort auf alle historischen Daten

**Nachteile:**
- Historische Reports ändern sich retroaktiv — nicht konform mit GHG-Protokoll-Auditierbarkeit
- Performance: Berechnungen bei jeder Dashboard-Abfrage

#### Option 3: Event-Sourcing / Immutable Log

Jede Faktor-Version wird als Ereignis gespeichert; Berechnungen replay.

**Vorteile:**
- Vollständige Audit-Spur

**Nachteile:**
- Massive Überkomplexität für eine Single-Tenant-App
- Erheblicher Entwicklungsaufwand

**Entscheidung:** **Option 1 — Jahresbasierte Versionierung mit gespeichertem CO₂e-Wert**

**Begründung:** Entspricht GHG-Protokoll-Anforderungen (historische Berichte reproduzierbar). Einfachste Implementierung. Faktor-Updates für vergangene Jahre sind selten; manuelle Neu-Berechnung ist vertretbar.

---

### ADR-003: Prisma-Schema-Design für Multi-Scope-Dateneingabe

**Status:** Akzeptiert

**Kontext:**  
Scope 1, 2 und 3 haben sehr unterschiedliche Kategorien und Einheiten. Das Schema muss flexibel, aber typsicher sein.

**Optionen:**

#### Option 1: Generische `EmissionEntry`-Tabelle mit `category`/`subcategory`-Strings (empfohlen)

Eine Tabelle für alle Scopes; Kategorie als String-Enum-Felder.

```prisma
model EmissionEntry {
  id                Int              @id @default(autoincrement())
  reportingPeriodId Int
  scope             Scope            // SCOPE1, SCOPE2, SCOPE3
  category          String           // "ERDGAS", "STROM", "GESCHAEFTSREISEN"
  subcategory       String?          // "FLUG_KURZSTRECKE", "BAHN"
  quantity          Decimal
  unit              String           // "m3", "kWh", "L", "km", "kg"
  co2e              Decimal
  sourceType        SourceType       // MANUAL, OCR
  createdAt         DateTime         @default(now())
}
```

**Vorteile:**
- Neue Kategorien ohne Schema-Migration hinzufügbar (nur neuer Emissionsfaktor in DB)
- Einheitliche Abfragen für alle Scopes
- Einfache Aggregation für Dashboard

**Nachteile:**
- Kein DB-Level-Constraint für gültige `category`/`subcategory`-Kombinationen
- Validierung muss in Anwendungslogik (Zod) erfolgen

#### Option 2: Separate Tabellen pro Scope (Scope1Entry, Scope2Entry, Scope3Entry)

Drei separate Modelle mit scope-spezifischen Feldern.

**Vorteile:**
- Starke Typisierung per Scope; DB-Constraints direkt möglich

**Nachteile:**
- 3× Code-Duplikation für CRUD, Berechnungen, Dashboard-Abfragen
- Schema-Migration bei jeder neuen Kategorie erforderlich
- Komplexere Aggregation (UNION-Abfragen)

#### Option 3: JSONB-Spalte für flexible Felder

`EmissionEntry` mit `data JSONB` für scope-spezifische Felder.

**Vorteile:**
- Maximale Flexibilität

**Nachteile:**
- Keine Typsicherheit; keine Prisma-Typen für JSONB-Inhalte
- Schwierige Migrationen bei Strukturänderungen

**Entscheidung:** **Option 1 — Generische `EmissionEntry`-Tabelle**

**Begründung:** Scope-3 hat viele Kategorien (Geschäftsreisen, Pendler, Materialien, Abfall) — separate Tabellen würden Duplikation explodieren lassen. Kategorievalidierung via Zod ist ausreichend. Aggregationen bleiben einfach.

---

### ADR-004: PDF-Generierung: React-PDF serverseitig

**Status:** Akzeptiert

**Kontext:**  
PDFs müssen serverseitig generiert werden (< 3 s), ohne Headless-Browser-Abhängigkeit.

**Optionen:**

#### Option 1: React-PDF (serverseitig, Node.js Runtime) — empfohlen

`@react-pdf/renderer` auf Server; PDF-Komponenten in React; Stream direkt an Client.

**Vorteile:**
- Declarative Layouts; wiederverwendbare Komponenten
- Kein Headless-Browser; geringe Latenz
- Next.js API Route mit `export const runtime = 'nodejs'`

**Nachteile:**
- Einschränkungen beim CSS (kein vollständiges CSS; eigene Layoutprimitives)
- Schriftarten müssen explizit eingebunden werden

#### Option 2: Puppeteer / Playwright (Headless Chromium)

HTML-Seite in Chromium rendern und als PDF exportieren.

**Vorteile:**
- Volle CSS-Unterstützung; präzises Rendering

**Nachteile:**
- Chromium-Binary (~150 MB) im Docker-Image
- Startup-Zeit von Chromium erhöht Latenz (5–15 s erste PDF)
- Nicht containerfreundlich ohne spezielle Konfiguration

#### Option 3: PDFKit (low-level)

Imperative PDF-Konstruktion mit `pdfkit`.

**Vorteile:**
- Minimal-Dependency; schnell

**Nachteile:**
- Imperativer Code für Layouts; keine Wiederverwendung von React-Komponenten
- Schwierig zu warten bei komplexen GHG-Report-Layouts

**Entscheidung:** **Option 1 — React-PDF serverseitig**

**Begründung:** Deklarative Layouts wiederverwendbar für Report, Badge und CSRD-PDF. Keine Headless-Browser-Latenz. Erfüllt < 3-Sekunden-Anforderung. Fest im Tech-Stack verankert.

---

### ADR-005: Keine Authentifizierung — Single-Tenant

**Status:** Akzeptiert

**Kontext:**  
Die Anwendung wird für einen einzigen Handwerksbetrieb betrieben und lokal via Docker Compose gestartet. Eine Anmelde-/Benutzerverwaltung wurde explizit ausgeschlossen.

**Entscheidung:** Keine Authentifizierung, keine Sessions, kein JWT.

**Begründung:**
- Anforderung explizit vorgegeben (Mandatory Override)
- App läuft lokal; Netzwerkzugang ist der Sicherheitsperimeter
- Reduziert Implementierungsaufwand erheblich

**Konsequenz:** Wenn die App zukünftig netzwerkexponiert betrieben wird, muss ein vorgeschalteter Reverse-Proxy (Nginx mit Basic Auth oder VPN) den Zugang sichern. Eine nachträgliche Auth-Integration erfordert Schema-Änderungen und ist als Erweiterungspunkt zu berücksichtigen.

---

## 10. Qualitätsanforderungen

### 10.1 Qualitätsbaum

```
Qualität
├── Korrektheit
│   ├── Berechnungsgenauigkeit (Decimal-Arithmetik, keine Float-Rundungsfehler)
│   └── Faktor-Aktualität (UBA 2024 in Seed-Daten)
├── Leistung
│   ├── PDF-Generierung < 3 Sekunden
│   ├── Dashboard-Ladezeit < 2 Sekunden
│   └── OCR-Antwortzeit < 30 Sekunden (Nutzer-Feedback via Loading-State)
├── Betriebsbereitschaft
│   ├── docker compose up → vollständig funktionsfähig
│   └── Schema + Seed automatisch beim Start
├── Wartbarkeit
│   ├── Emissionsfaktoren nur in DB (kein Hardcoding)
│   ├── Datei-Länge < 300 Zeilen (Refactoring-Grenze)
│   └── TypeScript strict mode überall
└── Zugänglichkeit
    ├── Mobile-First 375 px Viewport
    └── WCAG 2.1 AA (Kontrast, Keyboard-Navigation)
```

### 10.2 Qualitätsszenarien

| ID | Qualität | Stimulus | Reaktion | Messgröße |
|----|----------|---------|---------|----------|
| QS-1 | Korrektheit | Benutzer erfasst 1.000 m³ Erdgas für 2024 | Berechnung ergibt 1.000 × UBA-2024-Faktor = X kg CO₂e | Abweichung ≤ 0,01 % vom Referenzwert |
| QS-2 | Leistung | Benutzer klickt "PDF exportieren" | PDF wird zum Download angeboten | < 3 Sekunden |
| QS-3 | Leistung | Benutzer öffnet Dashboard mit 4 Quartalen Daten | Dashboard vollständig gerendert | < 2 Sekunden |
| QS-4 | Betriebsbereitschaft | Entwickler führt `docker compose up` aus (Erststart) | App erreichbar auf :3000, alle Daten vorhanden | < 3 Minuten bis betriebsbereit |
| QS-5 | Wartbarkeit | Neue UBA-Emissionsfaktoren 2025 veröffentlicht | Faktoren in DB eintragen; kein Code-Deployment nötig | Kein Code-Change erforderlich |
| QS-6 | Zugänglichkeit | Benutzer öffnet Dashboard auf iPhone SE (375 px) | Alle Inhalte lesbar, alle Aktionen ausführbar | Kein horizontales Scrollen; Touch-Targets ≥ 44 px |
| QS-7 | Korrektheit | Tesseract OCR schlägt fehl | Formular öffnet leer mit Hinweis; Benutzer kann manuell eingeben | Keine Datenverlust-Meldung; Fallback funktioniert |

---

## 11. Risiken und technische Schulden

### 11.1 Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|-----------|-----------|
| **OCR-Qualität unzureichend für Handwerker-Belege** | Mittel | Mittel | OCR-Ergebnisse immer als "Vorschlag" behandeln; Benutzer kann korrigieren; OCR-Fehler führen nie zu direktem Datenspeichern ohne Bestätigung |
| **PDF-Generierung überschreitet 3-Sekunden-Ziel bei großen Reports** | Niedrig | Mittel | Lazy loading von React-PDF-Komponenten; Server-seitiges Caching des letzten generierten PDFs mit kurzer TTL |
| **UBA-Emissionsfaktoren ändern sich rückwirkend** | Niedrig | Hoch | Seed-Skript dokumentiert Faktor-Quellen; manuelle Neu-Berechnungs-Funktion als Erweiterungspunkt vorsehen |
| **Docker Volume-Datenverlust bei `docker compose down -v`** | Niedrig | Hoch | Dokumentation: explizit warnen; Backup-Skript bereitstellen |
| **Tesseract-Service nicht erreichbar** | Niedrig | Niedrig | App-seitiger Fehler-Handler; Benutzer erhält Fallback auf manuelle Eingabe |

### 11.2 Technische Schulden

| Eintrag | Beschreibung | Auswirkung | Priorität | Plan |
|---------|-------------|-----------|-----------|------|
| **Kein Reverse-Proxy** | App direkt auf Port 3000 ohne TLS/Basic-Auth | Sicherheitsrisiko bei Netzwerkexposition | Mittel | Nginx-Config als optionaler Service in `docker-compose.override.yml` |
| **Kein E-Mail-Versand** | Berichte müssen manuell heruntergeladen werden | Benutzerkomfort | Niedrig | SMTP-Integration als spätere Erweiterung |
| **Kein automatisches Backup** | pg_data-Volume kann verloren gehen | Datenverlustrisiko | Mittel | Backup-Cron-Job oder `pg_dump`-Skript dokumentieren |
| **Keine Multi-Tenancy** | Hard-Coded Single-Tenant-Betrieb | Skalierungslimit | Niedrig | Auth + Tenant-Isolation als Erweiterungspunkt |
| **OCR-Parsing Heuristiken** | Text-Pattern-Matching für Belegsextraktion ist fragil | OCR-Genauigkeit | Mittel | Langfristig: LLM-basierte Extraktion oder strukturierte Belege |

---

## 12. Glossar

### Domänenbegriffe

| Begriff | Definition |
|---------|-----------|
| **GHG-Protokoll** | Greenhouse Gas Protocol — internationaler Standard zur CO₂-Bilanzierung; definiert Scope 1, 2 und 3 |
| **Scope 1** | Direkte Emissionen aus eigenen oder kontrollierten Quellen (Erdgas, Diesel, Firmenfahrzeuge) |
| **Scope 2** | Indirekte Emissionen aus eingekaufter Energie (Strom, Fernwärme) |
| **Scope 3** | Alle anderen indirekten Emissionen (Geschäftsreisen, Pendler, Materialien, Abfall) |
| **CO₂e** | CO₂-Äquivalent — Einheitsgröße für alle Treibhausgase, normiert auf CO₂-Wirkung |
| **UBA** | Umweltbundesamt — deutsche Bundesbehörde; veröffentlicht jährlich nationale Emissionsfaktoren |
| **Emissionsfaktor** | Umrechnungsgröße: Menge einer Aktivität (z. B. kWh Strom) → kg CO₂e |
| **ESG** | Environmental, Social, Governance — Nachhaltigkeitsrahmen für Unternehmensberichterstattung |
| **CSRD** | Corporate Sustainability Reporting Directive — EU-Richtlinie zur Nachhaltigkeitsberichterstattung |
| **Handwerksbetrieb** | Deutsches Handwerksunternehmen; Zielgruppe: 10–100 Mitarbeitende |
| **Branchenvergleich** | Benchmark-Werte aus Seed-Daten; vergleicht den Betrieb mit dem Branchendurchschnitt |
| **Nachhaltigkeits-Badge** | Visuelles PNG-Zertifikat + HTML-Embed-Code; zur Kommunikation der CO₂-Leistung |
| **Berichtszeitraum** | Jahr oder Quartal, für das Emissionsdaten erfasst werden |

### Technische Begriffe

| Begriff | Definition |
|---------|-----------|
| **ADR** | Architecture Decision Record — dokumentiert eine wichtige Architekturentscheidung mit Kontext und Begründung |
| **App Router** | Next.js 14 Routing-System; nutzt React Server Components; Dateisystem-basiertes Routing |
| **Docker Compose** | Werkzeug zur Definition und Ausführung multi-Container-Docker-Anwendungen via YAML-Datei |
| **Prisma** | TypeScript-ORM für PostgreSQL; bietet typsicheren DB-Client und Schema-Migrations-Tool |
| **React-PDF** | `@react-pdf/renderer` — Bibliothek zur serverseitigen PDF-Generierung mit React-Komponenten |
| **Server Action** | Next.js-Feature: asynchrone Serverfunktion, direkt aus React-Komponenten aufrufbar; ersetzt API-Routes für Formulare |
| **Server Component** | React-Komponente, die ausschließlich auf dem Server gerendert wird; hat Zugriff auf DB, Dateisystem etc. |
| **Tesseract OCR** | Open-Source-OCR-Engine; erkennt Text in Bildern und PDFs |
| **Single-Tenant** | Eine Anwendungsinstanz bedient genau einen Kunden/Betrieb — kein Mandanten-Konzept |
| **Seed-Daten** | Initiale Datenbankdaten, die beim ersten Start eingespielt werden (Emissionsfaktoren, Benchmarks) |
| **Zod** | TypeScript-Schema-Validierungsbibliothek; wird für Server-Action- und API-Input-Validierung eingesetzt |

---

## Anhang

### A. Referenzen

| Ressource | Beschreibung |
|-----------|-------------|
| [GHG Protocol](https://ghgprotocol.org/) | Internationaler Standard für CO₂-Bilanzierung |
| [UBA Emissionsfaktoren](https://www.umweltbundesamt.de/themen/klima-energie/treibhausgas-emissionen) | Offizielle deutsche Emissionsfaktoren |
| [CSRD Richtlinie](https://ec.europa.eu/sustainability-reporting/) | EU Corporate Sustainability Reporting Directive |
| [arc42 Template](https://arc42.org/) | Vorlage für diese Dokumentation |
| [Prisma Docs](https://www.prisma.io/docs/) | ORM-Dokumentation |
| [React-PDF](https://react-pdf.org/) | PDF-Renderer-Dokumentation |
| [Next.js App Router](https://nextjs.org/docs/app) | Framework-Dokumentation |
| [Tesseract.js](https://tesseract.projectnaptha.com/) | OCR-Engine-Dokumentation |

### B. Revisionshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|-----------|
| 1.0 | 2026-03-19 | Architect Agent | Initiale Version; alle 12 arc42-Abschnitte; ADRs 001–005 |

---

> **Hinweis:** Dieses Dokument ist ein lebendes Artefakt. Bitte bei wesentlichen Architekturänderungen aktualisieren — insbesondere nach Entscheidungen zu Emissionsfaktor-Management, OCR-Erweiterungen oder der Einführung von Authentifizierung.
