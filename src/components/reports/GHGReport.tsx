/**
 * GHG Protocol PDF Report for GrünBilanz.
 *
 * Generates a comprehensive CO₂e report following GHG Protocol Corporate Standard.
 * Uses @react-pdf/renderer for server-side PDF generation.
 *
 * Structure:
 * 1. Company header with logo, year, location
 * 2. Executive summary: total CO₂e, per-employee, vs benchmark
 * 3. Scope 1/2/3 breakdown tables
 * 4. Scope 3 materials table
 * 5. Methodology section with UBA 2024 factor citations
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import type { CO2eTotals, CompanyProfileData } from '@/types';
import { CATEGORY_LABELS, CATEGORY_UNITS } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottomWidth: 2, borderBottomColor: '#2D6A4F', paddingBottom: 12 },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  subtitle: { fontSize: 11, color: '#555', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginTop: 18, marginBottom: 8 },
  table: { marginBottom: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#D8F3DC', padding: '5 8', borderRadius: 3 },
  tableRow: { flexDirection: 'row', padding: '4 8', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', padding: '4 8', backgroundColor: '#f9fafb', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableCell: { fontSize: 9 },
  col1: { width: '40%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  kpiBox: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: '#D8F3DC', padding: 10, borderRadius: 4 },
  kpiLabel: { fontSize: 8, color: '#555' },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginTop: 2 },
  note: { fontSize: 8, color: '#777', marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#aaa', textAlign: 'center' },
  scopeLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff', backgroundColor: '#2D6A4F', padding: '3 8', borderRadius: 3, marginBottom: 4 },
  highlight: { color: '#E76F51', fontFamily: 'Helvetica-Bold' },
  // Dual Scope 2 comparison box
  scope2Box: { flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 12 },
  scope2Card: { flex: 1, borderWidth: 1, borderColor: '#D8F3DC', borderRadius: 4, padding: 8 },
  scope2CardLabel: { fontSize: 8, color: '#555', marginBottom: 3 },
  scope2CardValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2D6A4F' },
  scope2Note: { fontSize: 7.5, color: '#777', lineHeight: 1.5, marginBottom: 8 },
});

interface GHGReportProps {
  profile: CompanyProfileData;
  year: number;
  totals: CO2eTotals;
  entries: Array<{ category: string; quantity: number; isOekostrom: boolean; scope: string }>;
  materials: Array<{ material: string; quantityKg: number; supplierName?: string | null }>;
  benchmarkValue?: number;
}

export function GHGReport({ profile, year, totals, entries, materials, benchmarkValue = 12.5 }: GHGReportProps) {
  const co2ePerEmployee = profile.mitarbeiter > 0 ? totals.total / profile.mitarbeiter : 0;
  const vsBenchmark = benchmarkValue > 0 ? ((co2ePerEmployee - benchmarkValue) / benchmarkValue) * 100 : 0;

  const scope1Entries = entries.filter((e) => e.scope === 'SCOPE1');
  const scope2Entries = entries.filter((e) => e.scope === 'SCOPE2');
  const scope3Entries = entries.filter((e) => e.scope === 'SCOPE3');

  // Show dual Scope 2 comparison only when market-based differs from location-based
  const hasOekostrom = scope2Entries.some((e) => e.isOekostrom && e.category === 'STROM');
  const scope2DifferenceTonnes = totals.scope2LocationBased - totals.scope2;

  const renderScopeTable = (
    scopeEntries: typeof entries,
    scopeLabel: string,
    scopeTotal: number
  ) => (
    <View style={styles.table}>
      <Text style={styles.scopeLabel}>{scopeLabel}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.col1]}>Kategorie</Text>
        <Text style={[styles.tableHeaderCell, styles.col2]}>Menge</Text>
        <Text style={[styles.tableHeaderCell, styles.col3]}>Einheit</Text>
        <Text style={[styles.tableHeaderCell, styles.col4]}>CO₂e (t)</Text>
      </View>
      {scopeEntries.map((entry, i) => {
        const co2e = totals.byCategory[entry.category] ?? 0;
        const isNeg = co2e < 0;
        return (
          <View key={entry.category} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.col1]}>
              {(CATEGORY_LABELS as Record<string, string>)[entry.category] ?? entry.category}
              {entry.isOekostrom ? ' (Ökostrom)' : ''}
            </Text>
            <Text style={[styles.tableCell, styles.col2]}>{entry.quantity.toLocaleString('de-DE')}</Text>
            <Text style={[styles.tableCell, styles.col3]}>
              {(CATEGORY_UNITS as Record<string, string>)[entry.category] ?? '—'}
            </Text>
            <Text style={[styles.tableCell, styles.col4, isNeg ? styles.highlight : {}]}>
              {co2e.toFixed(3)}
            </Text>
          </View>
        );
      })}
      <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
        <Text style={[styles.tableHeaderCell, styles.col1]}>Summe {scopeLabel}</Text>
        <Text style={[styles.tableCell, styles.col2]} />
        <Text style={[styles.tableCell, styles.col3]} />
        <Text style={[styles.tableHeaderCell, styles.col4]}>{scopeTotal.toFixed(3)}</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>🌿 GrünBilanz CO₂-Bericht</Text>
            <Text style={styles.subtitle}>{profile.firmenname}</Text>
            <Text style={styles.note}>{profile.standort} · Berichtsjahr {year}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.note, { fontSize: 9 }]}>GHG Protocol Corporate Standard</Text>
            <Text style={[styles.note]}>UBA 2024 Emissionsfaktoren</Text>
            <Text style={[styles.note]}>Erstellt: {new Date().toLocaleDateString('de-DE')}</Text>
          </View>
        </View>

        {/* Executive Summary KPIs */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.kpiBox}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Gesamt CO₂e</Text>
            <Text style={styles.kpiValue}>{totals.total.toFixed(1)} t</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Pro Mitarbeiter</Text>
            <Text style={styles.kpiValue}>{co2ePerEmployee.toFixed(1)} t/MA</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>vs. Branchendurchschnitt</Text>
            <Text style={[styles.kpiValue, { color: vsBenchmark > 0 ? '#E76F51' : '#2D6A4F' }]}>
              {vsBenchmark > 0 ? '+' : ''}{vsBenchmark.toFixed(0)}%
            </Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Mitarbeitende</Text>
            <Text style={styles.kpiValue}>{profile.mitarbeiter}</Text>
          </View>
        </View>

        {/* Scope Tables */}
        <Text style={styles.sectionTitle}>Emissionen nach Scope (GHG Protocol)</Text>
        {renderScopeTable(scope1Entries, 'Scope 1 — Direkte Emissionen', totals.scope1)}
        {renderScopeTable(scope2Entries, 'Scope 2 — Energiebedingte Emissionen', totals.scope2)}

        {/* Dual Scope 2 method comparison — shown whenever Ökostrom data is present */}
        {hasOekostrom && (
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 10, marginTop: 6 }]}>
              Scope 2: Vergleich locationbasiert vs. marktbasiert
            </Text>
            <View style={styles.scope2Box}>
              <View style={styles.scope2Card}>
                <Text style={styles.scope2CardLabel}>Locationbasiert (Netzstrom-Durchschnitt)</Text>
                <Text style={styles.scope2CardValue}>{totals.scope2LocationBased.toFixed(3)} t CO₂e</Text>
              </View>
              <View style={styles.scope2Card}>
                <Text style={styles.scope2CardLabel}>Marktbasiert (lieferantenspezifisch)</Text>
                <Text style={styles.scope2CardValue}>{totals.scope2.toFixed(3)} t CO₂e</Text>
              </View>
            </View>
            <Text style={styles.scope2Note}>
              {`Der locationbasierte Ansatz verwendet den nationalen Netzstrom-Durchschnittsfaktor (UBA 2024). `}
              {`Der marktbasierte Ansatz berücksichtigt den lieferantenspezifischen Faktor für Ökostrom (UBA 2024), `}
              {`sofern ein Zertifikat oder Vertrag vorliegt. Die Differenz beträgt ${scope2DifferenceTonnes.toFixed(3)} t CO₂e. `}
              {`Beide Werte werden gemäß GHG Protocol Corporate Standard § 6.3 ausgewiesen.`}
            </Text>
          </View>
        )}

        {renderScopeTable(scope3Entries, 'Scope 3 — Vorgelagerte Emissionen', totals.scope3)}

        {/* Footer */}
        <Text style={styles.footer}>
          GrünBilanz · GHG Protocol Corporate Standard · Emissionsfaktoren: UBA 2024 · Seite 1
        </Text>
      </Page>

      {/* Materials Page */}
      {materials.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Scope 3 Kategorie 1 — Eingekaufte Materialien</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Material</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Menge (kg)</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Lieferant</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>CO₂e (t)</Text>
            </View>
            {materials.map((mat, i) => {
              const co2e = totals.byCategory[mat.material] ?? 0;
              return (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, styles.col1]}>{mat.material}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{mat.quantityKg.toLocaleString('de-DE')}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{mat.supplierName ?? '—'}</Text>
                  <Text style={[styles.tableCell, styles.col4]}>{co2e.toFixed(3)}</Text>
                </View>
              );
            })}
          </View>

          {/* Methodology */}
          <Text style={styles.sectionTitle}>Methodik</Text>
          <Text style={{ fontSize: 9, color: '#555', lineHeight: 1.6 }}>
            Diese CO₂-Bilanz wurde nach dem GHG Protocol Corporate Standard erstellt. 
            Alle Emissionsfaktoren stammen aus dem Umweltbundesamt (UBA) Datenbericht 2024.
            Die Berechnung folgt dem Ansatz: CO₂e = Aktivitätsdaten × Emissionsfaktor.
            Scope 3 Kategorie 1 umfasst vorgelagerte Emissionen eingekaufter Waren und Dienstleistungen.
            Negative Werte (z.B. Altmetall-Recycling) stellen anerkannte Gutschriften dar.
          </Text>

          <Text style={styles.footer}>
            GrünBilanz · GHG Protocol Corporate Standard · Emissionsfaktoren: UBA 2024 · Seite 2
          </Text>
        </Page>
      )}
    </Document>
  );
}
