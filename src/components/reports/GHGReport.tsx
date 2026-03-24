/**
 * GHG Protocol PDF Report for GrünBilanz.
 *
 * Generates a comprehensive CO₂e report following GHG Protocol Corporate Standard.
 * Uses @react-pdf/renderer for server-side PDF generation.
 *
 * Structure:
 * 1. Company header with logo, year, location
 * 2. Executive summary: total CO₂e, per-employee, vs benchmark
 * 3. Scope 1/2/3 breakdown tables (Scope 3 with GHG Protocol category numbers)
 * 4. Scope 3 Category 1 materials table (if any materials recorded)
 * 5. Methodology section with consolidation approach, GHG types, UBA 2024 factor citations
 * 6. Data Quality section listing all categories with their collection method
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import type { CO2eTotals, CompanyProfileData, EmissionCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_UNITS, SCOPE3_GHG_PROTOCOL_CATEGORY, CATEGORY_SCOPE } from '@/types';

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
  col1: { width: '38%' },
  col1Wide: { width: '48%' },
  col2: { width: '18%' },
  col3: { width: '18%' },
  col4: { width: '18%' },
  col5: { width: '8%' },
  kpiBox: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: '#D8F3DC', padding: 10, borderRadius: 4 },
  kpiLabel: { fontSize: 8, color: '#555' },
  kpiValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginTop: 2 },
  note: { fontSize: 8, color: '#777', marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#aaa', textAlign: 'center' },
  scopeLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff', backgroundColor: '#2D6A4F', padding: '3 8', borderRadius: 3, marginBottom: 4 },
  highlight: { color: '#E76F51', fontFamily: 'Helvetica-Bold' },
  dqGood: { color: '#2D6A4F', fontSize: 9 },
  dqMissing: { color: '#9ca3af', fontSize: 9, fontStyle: 'italic' },
});

interface GHGReportProps {
  profile: CompanyProfileData;
  year: number;
  totals: CO2eTotals;
  entries: Array<{ category: string; quantity: number; isOekostrom: boolean; scope: string; inputMethod: string }>;
  materials: Array<{ material: string; quantityKg: number; supplierName?: string | null }>;
  benchmarkValue?: number;
}

export function GHGReport({ profile, year, totals, entries, materials, benchmarkValue = 12.5 }: GHGReportProps) {
  const co2ePerEmployee = profile.mitarbeiter > 0 ? totals.total / profile.mitarbeiter : 0;
  const vsBenchmark = benchmarkValue > 0 ? ((co2ePerEmployee - benchmarkValue) / benchmarkValue) * 100 : 0;

  const scope1Entries = entries.filter((e) => e.scope === 'SCOPE1');
  const scope2Entries = entries.filter((e) => e.scope === 'SCOPE2');
  const scope3Entries = entries.filter((e) => e.scope === 'SCOPE3');

  const renderScopeTable = (
    scopeEntries: typeof entries,
    scopeLabel: string,
    scopeTotal: number,
    showCategory = false
  ) => (
    <View style={styles.table}>
      <Text style={styles.scopeLabel}>{scopeLabel}</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, showCategory ? styles.col1 : styles.col1Wide]}>Kategorie</Text>
        {showCategory && <Text style={[styles.tableHeaderCell, styles.col5]}>GHG Kat.</Text>}
        <Text style={[styles.tableHeaderCell, styles.col2]}>Menge</Text>
        <Text style={[styles.tableHeaderCell, styles.col3]}>Einheit</Text>
        <Text style={[styles.tableHeaderCell, styles.col4]}>CO₂e (t)</Text>
      </View>
      {scopeEntries.map((entry, i) => {
        const co2e = totals.byCategory[entry.category] ?? 0;
        const isNeg = co2e < 0;
        const ghgCat = (SCOPE3_GHG_PROTOCOL_CATEGORY as Record<string, string>)[entry.category];
        return (
          <View key={entry.category} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, showCategory ? styles.col1 : styles.col1Wide]}>
              {(CATEGORY_LABELS as Record<string, string>)[entry.category] ?? entry.category}
              {entry.isOekostrom ? ' (Ökostrom)' : ''}
            </Text>
            {showCategory && (
              <Text style={[styles.tableCell, styles.col5]}>{ghgCat ?? '—'}</Text>
            )}
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
        <Text style={[styles.tableHeaderCell, showCategory ? styles.col1 : styles.col1Wide]}>Summe {scopeLabel.split(' — ')[0]}</Text>
        {showCategory && <Text style={[styles.tableCell, styles.col5]} />}
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
        {renderScopeTable(scope3Entries, 'Scope 3 — Indirekte Emissionen', totals.scope3, true)}

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
              <Text style={[styles.tableHeaderCell, styles.col1Wide]}>Material</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Menge (kg)</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Lieferant</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>CO₂e (t)</Text>
            </View>
            {materials.map((mat, i) => {
              const co2e = totals.byCategory[mat.material] ?? 0;
              return (
                <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, styles.col1Wide]}>{mat.material}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{mat.quantityKg.toLocaleString('de-DE')}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{mat.supplierName ?? '—'}</Text>
                  <Text style={[styles.tableCell, styles.col4]}>{co2e.toFixed(3)}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.footer}>
            GrünBilanz · GHG Protocol Corporate Standard · Emissionsfaktoren: UBA 2024 · Seite 2
          </Text>
        </Page>
      )}

      {/* Methodology & Data Quality Page — always shown for GHG Protocol conformity */}
      <Page size="A4" style={styles.page}>
        {/* Methodology */}
        <Text style={styles.sectionTitle}>Methodik</Text>
        <Text style={{ fontSize: 9, color: '#555', lineHeight: 1.6 }}>
          Diese CO₂-Bilanz wurde nach dem GHG Protocol Corporate Standard (World Resources Institute / WBCSD, 2004) erstellt.{'\n'}
          Konsolidierungsansatz: Operationale Kontrolle.{'\n'}
          Erfasste Treibhausgase: CO₂, CH₄, N₂O sowie HFCs (Kältemittelverluste) — alle als CO₂e ausgewiesen.{'\n'}
          Emissionsfaktoren: Umweltbundesamt (UBA) Datenbericht 2024.{'\n'}
          Berechnungsansatz: CO₂e = Aktivitätsdaten × Emissionsfaktor.{'\n'}
          Scope 3 Kategorien (GHG Protocol): Kat. 1 Eingekaufte Güter/Dienstleistungen, Kat. 5 Abfallentsorgung, Kat. 6 Geschäftsreisen, Kat. 7 Pendlerverkehr.{'\n'}
          Negative Werte (z. B. Altmetall-Recycling) stellen anerkannte Gutschriften gemäß GHG Protocol dar.
        </Text>

        {/* Data Quality Section */}
        <Text style={styles.sectionTitle}>Datenqualität & Vollständigkeit</Text>
        <Text style={{ fontSize: 9, color: '#555', marginBottom: 8 }}>
          Gemäß GHG Protocol sind alle erfassten und nicht erfassten Kategorien offenzulegen.
        </Text>
        {(
          [
            { scopeLabel: 'Scope 1 — Direkte Emissionen', scope: 'SCOPE1' },
            { scopeLabel: 'Scope 2 — Energiebedingte Emissionen', scope: 'SCOPE2' },
            { scopeLabel: 'Scope 3 — Indirekte Emissionen', scope: 'SCOPE3' },
          ] as const
        ).map(({ scopeLabel, scope }) => {
          const categoriesForScope = (Object.keys(CATEGORY_SCOPE) as EmissionCategory[]).filter(
            (cat) => CATEGORY_SCOPE[cat] === scope
          );
          return (
            <View key={scope} style={{ marginBottom: 10 }}>
              <Text style={[styles.tableHeaderCell, { fontSize: 9, marginBottom: 4, color: '#2D6A4F' }]}>{scopeLabel}</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '55%' }]}>Kategorie</Text>
                <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Erhebungsstatus</Text>
              </View>
              {categoriesForScope.map((cat, i) => {
                const entry = entries.find((e) => e.category === cat);
                const label = (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat;
                const statusText = entry
                  ? `erfasst (${entry.inputMethod === 'OCR' ? 'gescannt' : entry.inputMethod === 'CSV' ? 'CSV' : 'manuell'})`
                  : 'nicht erfasst';
                return (
                  <View key={cat} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCell, { width: '55%' }]}>{label}</Text>
                    <Text style={[styles.tableCell, { width: '45%' }, entry ? styles.dqGood : styles.dqMissing]}>
                      {statusText}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.footer}>
          GrünBilanz · GHG Protocol Corporate Standard · Emissionsfaktoren: UBA 2024 · Seite {materials.length > 0 ? '3' : '2'}
        </Text>
      </Page>
    </Document>
  );
}
