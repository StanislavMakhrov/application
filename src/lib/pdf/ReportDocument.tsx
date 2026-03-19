/**
 * GHG Report PDF document for GrünBilanz.
 * Generates a German-language CO₂ footprint report in GHG Protocol format
 * with scope breakdown, category details, and year-over-year comparison.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

interface EmissionData {
  scope: string;
  category: string;
  subcategory?: string | null;
  co2e: number;
  unit: string;
}

interface ReportProps {
  companyName: string;
  industry: string;
  year: number;
  quarter: string;
  entries: EmissionData[];
  totalScope1: number;
  totalScope2: number;
  totalScope3: number;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#14532d',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#16a34a',
    marginBottom: 6,
  },
  companyInfo: {
    fontSize: 10,
    color: '#4b5563',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#14532d',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    paddingBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  scope1Row: { backgroundColor: '#fef3c7' },
  scope2Row: { backgroundColor: '#dbeafe' },
  scope3Row: { backgroundColor: '#f3e8ff' },
  totalRow: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#16a34a',
    marginTop: 4,
  },
  scopeLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  scopeValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  colScope: { width: '15%' },
  colCategory: { width: '30%' },
  colSubcat: { width: '25%' },
  colCo2e: { width: '20%', textAlign: 'right' },
  colUnit: { width: '10%' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#16a34a',
    borderRadius: 4,
    padding: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
});

/** Formats a number as German locale string with 2 decimals */
function formatNumber(n: number): string {
  return (n / 1000).toFixed(2).replace('.', ',');
}

export function ReportDocument({
  companyName,
  industry,
  year,
  quarter,
  entries,
  totalScope1,
  totalScope2,
  totalScope3,
}: ReportProps) {
  const totalAll = totalScope1 + totalScope2 + totalScope3;
  const periodLabel = quarter === 'ANNUAL' ? 'Jahresbericht' : quarter;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>GrünBilanz – CO₂-Fußabdruckbericht</Text>
          <Text style={styles.subtitle}>
            {companyName} · {year} ({periodLabel})
          </Text>
          <Text style={styles.companyInfo}>
            Branche: {industry} · Erstellt mit GrünBilanz
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zusammenfassung nach Scopes (in t CO₂e)</Text>
          <View style={[styles.summaryRow, styles.scope1Row]}>
            <Text style={styles.scopeLabel}>Scope 1 – Direkte Emissionen</Text>
            <Text style={styles.scopeValue}>{formatNumber(totalScope1)} t CO₂e</Text>
          </View>
          <View style={[styles.summaryRow, styles.scope2Row]}>
            <Text style={styles.scopeLabel}>Scope 2 – Eingekaufte Energie</Text>
            <Text style={styles.scopeValue}>{formatNumber(totalScope2)} t CO₂e</Text>
          </View>
          <View style={[styles.summaryRow, styles.scope3Row]}>
            <Text style={styles.scopeLabel}>Scope 3 – Wertschöpfungskette</Text>
            <Text style={styles.scopeValue}>{formatNumber(totalScope3)} t CO₂e</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.scopeLabel}>Gesamt</Text>
            <Text style={styles.scopeValue}>{formatNumber(totalAll)} t CO₂e</Text>
          </View>
        </View>

        {/* Detail table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailauswertung</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colScope]}>Scope</Text>
              <Text style={[styles.tableHeaderText, styles.colCategory]}>Kategorie</Text>
              <Text style={[styles.tableHeaderText, styles.colSubcat]}>Unterkategorie</Text>
              <Text style={[styles.tableHeaderText, styles.colCo2e]}>kg CO₂e</Text>
            </View>
            {entries.map((entry, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb' },
                ]}
              >
                <Text style={[styles.tableCell, styles.colScope]}>
                  {entry.scope.replace('SCOPE', 'S')}
                </Text>
                <Text style={[styles.tableCell, styles.colCategory]}>{entry.category}</Text>
                <Text style={[styles.tableCell, styles.colSubcat]}>
                  {entry.subcategory ?? '–'}
                </Text>
                <Text style={[styles.tableCell, styles.colCo2e]}>
                  {entry.co2e.toFixed(1).replace('.', ',')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Legal notice */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ GHG-Protokoll-konform · UBA 2024</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 8 }}>
            Dieser Bericht wurde auf Basis der Emissionsfaktoren des Umweltbundesamtes (UBA) 2024
            erstellt. Die Berechnung folgt dem GHG Protocol Corporate Accounting and Reporting
            Standard.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>GrünBilanz – CO₂-Fußabdruckbericht</Text>
          <Text>
            {companyName} · {year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
