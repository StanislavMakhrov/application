/**
 * Methodology & Data Quality page for the GHG Protocol PDF report.
 *
 * This page is rendered as the final page of the GHGReport document when
 * methodology data is available. It replaces the former static "Methodik"
 * paragraph with a structured, auto-assembled block covering:
 * - GHG Protocol standard declaration and scope coverage
 * - Emission factor table (key, value, unit, source, valid year)
 * - Data quality table (input method per category)
 * - Reporting boundary notes and exclusions
 *
 * Extracted from GHGReport.tsx to keep that file under the 300-line limit
 * defined in docs/conventions.md.
 */

import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { MethodologyData } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginTop: 18, marginBottom: 8 },
  introText: { fontSize: 9, color: '#444', lineHeight: 1.5, marginBottom: 8 },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#D8F3DC', padding: '5 8', borderRadius: 3 },
  tableRow: { flexDirection: 'row', padding: '4 8', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableRowAlt: { flexDirection: 'row', padding: '4 8', backgroundColor: '#f9fafb', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  tableHeaderCell: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableCell: { fontSize: 9 },
  boundaryBox: { backgroundColor: '#f0fdf4', borderRadius: 4, padding: 10, marginTop: 6, marginBottom: 2 },
  boundaryLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginBottom: 3 },
  boundaryText: { fontSize: 8, color: '#444', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#aaa', textAlign: 'center' },
  // Column widths for the factor table (6 columns)
  factorCol1: { width: '24%' }, // Kategorie
  factorCol2: { width: '12%' }, // Scope
  factorCol3: { width: '18%' }, // Faktor
  factorCol4: { width: '12%' }, // Einheit
  factorCol5: { width: '24%' }, // Quelle
  factorCol6: { width: '10%' }, // Jahr
  // Column widths for the quality table (2 columns)
  qualCol1: { width: '60%' }, // Kategorie
  qualCol2: { width: '40%' }, // Eingabemethode
});

/** Maps Scope enum values to human-readable German labels. */
const SCOPE_LABELS: Record<string, string> = {
  SCOPE1: 'Scope 1',
  SCOPE2: 'Scope 2',
  SCOPE3: 'Scope 3',
};

/** Maps InputMethod enum values to human-readable German labels. */
const INPUT_METHOD_LABELS: Record<string, string> = {
  MANUAL: 'Manuell',
  OCR: 'OCR (Rechnung)',
  CSV: 'CSV-Import',
};

interface GHGReportMethodologyPageProps {
  methodology: MethodologyData;
  pageNumber: number;
}

/**
 * Renders the "Methodik & Datenqualität" PDF page with four sections:
 * 1. Standard & scope coverage
 * 2. Emission factor table
 * 3. Data quality table
 * 4. Assumptions & reporting boundaries
 */
export function GHGReportMethodologyPage({ methodology, pageNumber }: GHGReportMethodologyPageProps) {
  const scopeList = methodology.scopesIncluded
    .map((s) => SCOPE_LABELS[s] ?? s)
    .join(', ');

  return (
    <Page size="A4" style={styles.page}>
      {/* Section 1: Standard & Scope Coverage */}
      <Text style={styles.sectionTitle}>Methodik & Datenqualität</Text>
      <Text style={styles.introText}>
        {`Diese CO₂-Bilanz wurde nach dem ${methodology.standard} erstellt`}
        {scopeList ? ` und umfasst ${scopeList}.` : '.'}
        {' Fehlende Kategorien sind als „Faktor nicht gefunden" gekennzeichnet.'}
      </Text>

      {/* Section 2: Emission Factor Table */}
      <Text style={styles.sectionTitle}>Emissionsfaktoren</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.factorCol1]}>Kategorie</Text>
          <Text style={[styles.tableHeaderCell, styles.factorCol2]}>Scope</Text>
          <Text style={[styles.tableHeaderCell, styles.factorCol3]}>Faktor (kg CO₂e)</Text>
          <Text style={[styles.tableHeaderCell, styles.factorCol4]}>Einheit</Text>
          <Text style={[styles.tableHeaderCell, styles.factorCol5]}>Quelle</Text>
          <Text style={[styles.tableHeaderCell, styles.factorCol6]}>Jahr</Text>
        </View>
        {methodology.factorRows.map((row, i) => (
          <View key={row.categoryKey} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.factorCol1]}>{row.categoryLabel}</Text>
            <Text style={[styles.tableCell, styles.factorCol2]}>{SCOPE_LABELS[row.scope] ?? row.scope}</Text>
            <Text style={[styles.tableCell, styles.factorCol3]}>
              {row.factorKg !== null ? row.factorKg.toFixed(4) : '–'}
            </Text>
            <Text style={[styles.tableCell, styles.factorCol4]}>{row.unit}</Text>
            <Text style={[styles.tableCell, styles.factorCol5]}>
              {row.source ?? 'Faktor nicht gefunden'}
            </Text>
            <Text style={[styles.tableCell, styles.factorCol6]}>
              {row.validYear !== null ? String(row.validYear) : '–'}
            </Text>
          </View>
        ))}
      </View>

      {/* Section 3: Data Quality Table */}
      <Text style={styles.sectionTitle}>Datenqualität</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.qualCol1]}>Kategorie</Text>
          <Text style={[styles.tableHeaderCell, styles.qualCol2]}>Eingabemethode</Text>
        </View>
        {methodology.qualityRows.map((row, i) => (
          <View key={row.categoryKey} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, styles.qualCol1]}>{row.categoryLabel}</Text>
            <Text style={[styles.tableCell, styles.qualCol2]}>
              {INPUT_METHOD_LABELS[row.inputMethod] ?? row.inputMethod}
            </Text>
          </View>
        ))}
      </View>

      {/* Section 4: Assumptions & Reporting Boundaries */}
      <Text style={styles.sectionTitle}>Annahmen & Berichtsgrenzen</Text>
      {methodology.boundaryNotes ? (
        <View style={styles.boundaryBox}>
          <Text style={styles.boundaryLabel}>Systemgrenzen & Berichtsrahmen</Text>
          <Text style={styles.boundaryText}>{methodology.boundaryNotes}</Text>
        </View>
      ) : null}
      {methodology.exclusions ? (
        <View style={[styles.boundaryBox, { marginTop: 6 }]}>
          <Text style={styles.boundaryLabel}>Ausschlüsse & Annahmen</Text>
          <Text style={styles.boundaryText}>{methodology.exclusions}</Text>
        </View>
      ) : null}
      {!methodology.boundaryNotes && !methodology.exclusions && (
        <View style={styles.boundaryBox}>
          <Text style={styles.boundaryText}>Keine benutzerdefinierten Annahmen eingetragen.</Text>
        </View>
      )}

      <Text style={styles.footer}>
        {`GrünBilanz · GHG Protocol Corporate Standard · Emissionsfaktoren: UBA 2024 · Seite ${pageNumber}`}
      </Text>
    </Page>
  );
}
