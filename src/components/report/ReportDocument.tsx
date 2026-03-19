/**
 * React-PDF document component for the GrünBilanz CO₂ report.
 *
 * Renders a single-page PDF with company details, energy consumption table,
 * CO₂ breakdown (Scope 1 & 2), and industry benchmark comparison.
 *
 * This component is intentionally kept presentational — all data must be
 * passed in as props so it can be rendered server-side without database access.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { BenchmarkData } from '@/lib/benchmarks';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    paddingBottom: 12,
  },
  brand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#4b5563',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    color: '#6b7280',
    flex: 2,
  },
  value: {
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },
  scopeBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  scopeCard: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  scopeCardTotal: {
    flex: 1,
    backgroundColor: '#15803d',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  scopeLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scopeLabelTotal: {
    fontSize: 8,
    color: '#bbf7d0',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scopeValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  scopeValueTotal: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  scopeUnit: {
    fontSize: 8,
    color: '#6b7280',
  },
  scopeUnitTotal: {
    fontSize: 8,
    color: '#bbf7d0',
  },
  benchmarkRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  benchmarkItem: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  benchmarkLabel: {
    fontSize: 8,
    color: '#9ca3af',
    marginBottom: 2,
  },
  benchmarkValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  infoLabel: {
    flex: 1,
    color: '#6b7280',
  },
  infoValue: {
    flex: 2,
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export interface ReportDocumentProps {
  companyName: string;
  branche: string;
  mitarbeiter: number;
  standort: string;
  year: number;
  strom_kwh: number;
  erdgas_m3: number;
  diesel_l: number;
  heizoel_l: number;
  scope1_t: number;
  scope2_t: number;
  total_t: number;
  benchmark?: BenchmarkData;
}

export default function ReportDocument({
  companyName,
  branche,
  mitarbeiter,
  standort,
  year,
  strom_kwh,
  erdgas_m3,
  diesel_l,
  heizoel_l,
  scope1_t,
  scope2_t,
  total_t,
  benchmark,
}: ReportDocumentProps) {
  return (
    <Document
      title={`GrünBilanz CO₂-Bericht ${year} — ${companyName}`}
      author="GrünBilanz"
      subject="CO₂-Fußabdruck nach GHG-Protokoll Scope 1 & 2"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>🌱 GrünBilanz</Text>
          <Text style={styles.subtitle}>
            CO₂-Bericht {year} — erstellt nach GHG-Protokoll Scope 1 &amp; 2
          </Text>
        </View>

        {/* Company info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Betriebsinformationen</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Betrieb</Text>
            <Text style={styles.infoValue}>{companyName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Branche</Text>
            <Text style={styles.infoValue}>{branche}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mitarbeiter</Text>
            <Text style={styles.infoValue}>{mitarbeiter}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Standort</Text>
            <Text style={styles.infoValue}>{standort}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Berichtsjahr</Text>
            <Text style={styles.infoValue}>{year}</Text>
          </View>
        </View>

        {/* Energy consumption */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energieverbrauch</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Strom</Text>
            <Text style={styles.value}>{strom_kwh.toLocaleString('de-DE')} kWh</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Erdgas</Text>
            <Text style={styles.value}>{erdgas_m3.toLocaleString('de-DE')} m³</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Diesel</Text>
            <Text style={styles.value}>{diesel_l.toLocaleString('de-DE')} L</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Heizöl</Text>
            <Text style={styles.value}>{heizoel_l.toLocaleString('de-DE')} L</Text>
          </View>
        </View>

        {/* CO₂ results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CO₂-Emissionen</Text>
          <View style={styles.scopeBox}>
            <View style={styles.scopeCard}>
              <Text style={styles.scopeLabel}>Scope 1</Text>
              <Text style={styles.scopeValue}>{scope1_t.toLocaleString('de-DE')}</Text>
              <Text style={styles.scopeUnit}>t CO₂</Text>
              <Text style={[styles.scopeLabel, { marginTop: 2 }]}>Direkte Emissionen</Text>
            </View>
            <View style={styles.scopeCard}>
              <Text style={styles.scopeLabel}>Scope 2</Text>
              <Text style={styles.scopeValue}>{scope2_t.toLocaleString('de-DE')}</Text>
              <Text style={styles.scopeUnit}>t CO₂</Text>
              <Text style={[styles.scopeLabel, { marginTop: 2 }]}>Strom (indirekt)</Text>
            </View>
            <View style={styles.scopeCardTotal}>
              <Text style={styles.scopeLabelTotal}>Gesamt</Text>
              <Text style={styles.scopeValueTotal}>{total_t.toLocaleString('de-DE')}</Text>
              <Text style={styles.scopeUnitTotal}>t CO₂</Text>
              <Text style={[styles.scopeLabelTotal, { marginTop: 2 }]}>Scope 1 + 2</Text>
            </View>
          </View>
        </View>

        {/* Benchmark comparison */}
        {benchmark && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Branchenvergleich — {branche}</Text>
            <View style={styles.benchmarkRow}>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>P25 (effizient)</Text>
                <Text style={styles.benchmarkValue}>
                  {benchmark.p25_t.toLocaleString('de-DE')} t
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>Median</Text>
                <Text style={styles.benchmarkValue}>
                  {benchmark.median_t.toLocaleString('de-DE')} t
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>P75 (viel)</Text>
                <Text style={styles.benchmarkValue}>
                  {benchmark.p75_t.toLocaleString('de-DE')} t
                </Text>
              </View>
              <View
                style={[
                  styles.benchmarkItem,
                  { backgroundColor: total_t <= benchmark.median_t ? '#f0fdf4' : '#fef3c7' },
                ]}
              >
                <Text style={styles.benchmarkLabel}>Ihr Betrieb</Text>
                <Text
                  style={[
                    styles.benchmarkValue,
                    {
                      color:
                        total_t <= benchmark.median_t ? '#15803d' : '#b45309',
                    },
                  ]}
                >
                  {total_t.toLocaleString('de-DE')} t
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Erstellt mit GrünBilanz | UBA 2024 Emissionsfaktoren | GHG-Protokoll Scope 1 &amp; 2
        </Text>
      </Page>
    </Document>
  );
}
