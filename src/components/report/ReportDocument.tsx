import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { Company, EnergyEntry, BenchmarkData } from '@/types';
import React from 'react';

interface ReportDocumentProps {
  company: Company;
  entry: EnergyEntry;
  benchmark: BenchmarkData;
  year: number;
}

/** Styles for the PDF report */
const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    borderBottom: '2 solid #16a34a',
    paddingBottom: 16,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    marginBottom: 8,
    marginTop: 16,
    borderBottom: '1 solid #bbf7d0',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '0.5 solid #f3f4f6',
  },
  rowLabel: { color: '#374151' },
  rowValue: { fontFamily: 'Helvetica-Bold', color: '#111827' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#15803d' },
  totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#15803d' },
  disclaimer: {
    fontSize: 7.5,
    color: '#9ca3af',
    marginTop: 32,
    borderTop: '0.5 solid #e5e7eb',
    paddingTop: 8,
  },
  benchmarkBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
});

/**
 * React-PDF document for the GHG Protocol compliant CO₂ report.
 * Renders a structured PDF with company info, Scope 1/2 emissions,
 * and benchmark comparison.
 */
export function ReportDocument({ company, entry, benchmark, year }: ReportDocumentProps): React.ReactElement<DocumentProps> {
  return (
    <Document
      title={`GrünBilanz CO₂-Bericht ${year} – ${company.name}`}
      author="GrünBilanz"
      subject="CO₂-Bilanz nach GHG Protocol"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>GrünBilanz</Text>
            <Text style={styles.brandSub}>CO₂-Bilanz für Handwerksbetriebe</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'right' }}>
              Erstellt am {new Date().toLocaleDateString('de-DE')}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>CO₂-Bilanz {year}</Text>
        <Text style={styles.subtitle}>
          {company.name} · {company.branche} · {company.mitarbeiter} Mitarbeiter · {company.standort}
        </Text>

        {/* Scope 1 */}
        <Text style={styles.sectionTitle}>Scope 1 – Direkte Emissionen (Verbrennung)</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Erdgas</Text>
          <Text style={styles.rowValue}>{entry.erdgas_m3.toLocaleString('de-DE')} m³</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Diesel</Text>
          <Text style={styles.rowValue}>{entry.diesel_l.toLocaleString('de-DE')} L</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Heizöl</Text>
          <Text style={styles.rowValue}>{entry.heizoel_l.toLocaleString('de-DE')} L</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Scope 1 gesamt</Text>
          <Text style={styles.totalValue}>{entry.co2_scope1_t.toFixed(3)} t CO₂e</Text>
        </View>

        {/* Scope 2 */}
        <Text style={styles.sectionTitle}>Scope 2 – Indirekte Emissionen (Strom)</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Strombezug</Text>
          <Text style={styles.rowValue}>{entry.strom_kwh.toLocaleString('de-DE')} kWh</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Scope 2 gesamt</Text>
          <Text style={styles.totalValue}>{entry.co2_scope2_t.toFixed(3)} t CO₂e</Text>
        </View>

        {/* Total */}
        <Text style={styles.sectionTitle}>Gesamtemissionen</Text>
        <View style={[styles.totalRow, { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.totalLabel, { fontSize: 13 }]}>CO₂ gesamt (Scope 1+2)</Text>
          <Text style={[styles.totalValue, { fontSize: 13 }]}>{entry.co2_total_t.toFixed(3)} t CO₂e</Text>
        </View>

        {/* Benchmark */}
        <Text style={styles.sectionTitle}>Branchenvergleich: {benchmark.branche}</Text>
        <View style={styles.benchmarkBox}>
          <View style={styles.benchmarkRow}>
            <Text>Ihr Betrieb</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{entry.co2_total_t.toFixed(2)} t CO₂e</Text>
          </View>
          <View style={styles.benchmarkRow}>
            <Text>Branchenmedian</Text>
            <Text>{benchmark.median_t.toFixed(1)} t CO₂e</Text>
          </View>
          <View style={styles.benchmarkRow}>
            <Text>Unterschied zum Median</Text>
            <Text style={{ color: entry.co2_total_t <= benchmark.median_t ? '#15803d' : '#dc2626' }}>
              {(entry.co2_total_t - benchmark.median_t).toFixed(2)} t CO₂e
              {entry.co2_total_t <= benchmark.median_t ? ' (unter Median)' : ' (über Median)'}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Berechnet nach GHG Protocol Scope 1 &amp; 2, UBA 2024 Emissionsfaktoren.
          Emissionsfaktoren: Strom 0,380 kg CO₂/kWh (UBA 2024), Erdgas 2,0 kg CO₂/m³,
          Diesel 2,65 kg CO₂/L, Heizöl 2,68 kg CO₂/L. Angaben ohne Gewähr.
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Typed factory that creates a ReportDocument element compatible with
 * @react-pdf/renderer's renderToBuffer, which expects ReactElement<DocumentProps>.
 */
export function createReportElement(props: ReportDocumentProps): React.ReactElement<DocumentProps> {
  return React.createElement(ReportDocument, props) as React.ReactElement<DocumentProps>;
}
