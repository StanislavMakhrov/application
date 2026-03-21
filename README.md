# 🌿 GrünBilanz — CO₂-Fußabdruck für Handwerksbetriebe

GrünBilanz ist eine B2B-Webanwendung zur CO₂-Bilanzierung und ESG-Berichterstattung
für deutsche Handwerksbetriebe (10–100 Mitarbeitende). Die App folgt dem GHG Protocol
Corporate Standard und verwendet offizielle UBA 2024 Emissionsfaktoren.

## Schnellstart mit Docker

```bash
docker compose up --build
```

Die App ist dann unter <http://localhost:3000> erreichbar.

## Lokale Entwicklung

```bash
# 1. Dependencies installieren
npm install

# 2. .env anlegen (Kopie von .env.example)
cp .env.example .env

# 3. PostgreSQL lokal starten (z.B. mit Docker)
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=gruenbilanz \
  -e POSTGRES_PASSWORD=gruenbilanz \
  -e POSTGRES_DB=gruenbilanz \
  postgres:15

# 4. Datenbank migrieren und seeden
npm run db:migrate
npm run db:seed

# 5. Entwicklungsserver starten
npm run dev
```

## Architektur

| Komponente      | Technologie                   |
|-----------------|-------------------------------|
| Frontend        | Next.js 14 App Router + React |
| Sprache         | TypeScript (strict)           |
| Styling         | Tailwind CSS                  |
| Datenbank       | PostgreSQL 15 via Prisma      |
| Charts          | Recharts                      |
| PDF-Generierung | @react-pdf/renderer           |
| OCR-Service     | Tesseract.js (Microservice)   |
| Deployment      | Docker (2 Container)          |

## Features

- 📊 **Dashboard**: CO₂e-Übersicht mit Scope 1/2/3 Donut-Chart,
  Jahresvergleich, Branchenvergleich
- 🧙 **7-Schritte-Wizard**: Geführte Dateneingabe (Heizung, Fuhrpark,
  Strom, Dienstreisen, Materialien, Abfall)
- 📄 **PDF-Berichte**: GHG Protocol Bericht + CSRD-Fragebogen zum Download
- 📸 **OCR**: Rechnungen als PDF hochladen, Werte werden automatisch erkannt
- 📊 **CSV-Import**: DATEV-Exporte direkt importieren
- 🏷️ **Badge**: Embeddable CO₂e-Badge für Websites

## Emissionsfaktoren

Alle Faktoren aus dem UBA Datenbericht 2024, gespeichert in der Datenbank
(nie hardcodiert). Scope 1, 2, 3 — inkl. Ökostrom-Variante und negativem
Faktor für Altmetall-Recycling.

## Tests

```bash
npm test
npm run test:coverage
```

## Lizenz

MIT — siehe LICENSE
