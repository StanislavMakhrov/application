/**
 * GrünBilanz PDF Report Component.
 * Uses @react-pdf/renderer for server-side PDF generation.
 *
 * Layout follows GHG Protocol reporting structure:
 * - Company info header
 * - Scope 1 breakdown (direct emissions by fuel type)
 * - Scope 2 (indirect emissions from electricity)
 * - Total CO₂ summary
 * - Methodology note and GrünBilanz branding footer
 */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Company } from '@/services/companies';
import type { EnergyEntry } from '@/services/energy-entries';
import { UBA_2024 } from '@/lib/emission-factors';

interface ReportProps {
  company: Company;
  entry: EnergyEntry;
  year: number;
}

// PDF styles — react-pdf uses a Flexbox subset, not standard CSS
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    backgroundColor: '#16a34a', // green-700
    color: '#ffffff',
    padding: 16,
    borderRadius: 4,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#dcfce7',
  },
  // Section
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid #d1fae5',
  },
  section: {
    marginBottom: 20,
  },
  // Company info
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  infoItem: {
    width: '48%',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  // Data rows
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '1px solid #f3f4f6',
  },
  dataLabel: {
    color: '#374151',
  },
  dataValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  // Total row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #d1d5db',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Methodology note
  methodologyBox: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  methodologyText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.5,
  },
});

/**
 * GruenBilanzReport — the top-level PDF document component.
 * Named export so it can be imported by the API route without default export conflicts.
 */
export function GruenBilanzReport({ company, entry, year }: ReportProps) {
  // Scope 1 sub-values using UBA 2024 factors (kg → t)
  const erdgasCO2 = (entry.erdgas_m3 * UBA_2024.erdgas_m3) / 1000;
  const dieselCO2 = (entry.diesel_l * UBA_2024.diesel_l) / 1000;
  const heizoelCO2 = (entry.heizoel_l * UBA_2024.heizoel_l) / 1000;

  const generatedAt = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Document
      title={`GrünBilanz CO₂-Bericht ${year} – ${company.name}`}
      author="GrünBilanz"
      subject={`CO₂-Fußabdruck Berichtsjahr ${year}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌿 GrünBilanz – CO₂-Bericht</Text>
          <Text style={styles.headerSubtitle}>
            Berichtsjahr {year} · Erstellt am {generatedAt}
          </Text>
        </View>

        {/* Company information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unternehmensinformationen</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Unternehmen</Text>
              <Text style={styles.infoValue}>{company.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Branche</Text>
              <Text style={styles.infoValue}>{company.branche}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mitarbeiter</Text>
              <Text style={styles.infoValue}>{company.mitarbeiter}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Standort</Text>
              <Text style={styles.infoValue}>{company.standort}</Text>
            </View>
          </View>
        </View>

        {/* Scope 1 breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scope 1 – Direkte Emissionen (Brennstoffe)
          </Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>
              Erdgas ({entry.erdgas_m3.toLocaleString('de-DE')} m³ × {UBA_2024.erdgas_m3} kg CO₂/m³)
            </Text>
            <Text style={styles.dataValue}>{erdgasCO2.toFixed(3)} t CO₂</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>
              Diesel ({entry.diesel_l.toLocaleString('de-DE')} L × {UBA_2024.diesel_l} kg CO₂/L)
            </Text>
            <Text style={styles.dataValue}>{dieselCO2.toFixed(3)} t CO₂</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>
              Heizöl ({entry.heizoel_l.toLocaleString('de-DE')} L × {UBA_2024.heizoel_l} kg CO₂/L)
            </Text>
            <Text style={styles.dataValue}>{heizoelCO2.toFixed(3)} t CO₂</Text>
          </View>

          <View style={[styles.dataRow, { borderBottom: 'none', paddingTop: 8 }]}>
            <Text style={[styles.dataLabel, { fontFamily: 'Helvetica-Bold' }]}>
              Scope 1 Gesamt
            </Text>
            <Text style={[styles.dataValue, { color: '#15803d' }]}>
              {entry.co2_scope1_t.toFixed(3)} t CO₂
            </Text>
          </View>
        </View>

        {/* Scope 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scope 2 – Indirekte Emissionen (Strom)
          </Text>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>
              Strom ({entry.strom_kwh.toLocaleString('de-DE')} kWh × {UBA_2024.strom_kwh} kg CO₂/kWh)
            </Text>
            <Text style={styles.dataValue}>{entry.co2_scope2_t.toFixed(3)} t CO₂</Text>
          </View>

          <View style={[styles.dataRow, { borderBottom: 'none', paddingTop: 8 }]}>
            <Text style={[styles.dataLabel, { fontFamily: 'Helvetica-Bold' }]}>
              Scope 2 Gesamt
            </Text>
            <Text style={[styles.dataValue, { color: '#15803d' }]}>
              {entry.co2_scope2_t.toFixed(3)} t CO₂
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gesamtemissionen (Scope 1 + 2)</Text>
          <Text style={styles.totalValue}>{entry.co2_total_t.toFixed(3)} t CO₂</Text>
        </View>

        {/* Methodology note */}
        <View style={[styles.methodologyBox, { marginTop: 20 }]}>
          <Text style={styles.methodologyText}>
            Methodik: Berechnung gemäß GHG-Protokoll (Corporate Standard) für Scope 1 und Scope 2.
            Emissionsfaktoren: UBA 2024 (Umweltbundesamt). Scope 1 umfasst direkte Emissionen aus
            der Verbrennung von Erdgas, Diesel und Heizöl im Betrieb. Scope 2 umfasst indirekte
            Emissionen aus dem Bezug von Strom (Standortbasierte Methode, dt. Strommix 2024:
            0,380 kg CO₂/kWh).
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            GrünBilanz – CO₂-Fußabdruck für Handwerksbetriebe · {generatedAt} ·
            Dieser Bericht wurde automatisch erstellt und dient als interne Dokumentation.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
