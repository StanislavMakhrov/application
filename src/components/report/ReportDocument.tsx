/**
 * ReportDocument — React-PDF component for the GrünBilanz CO₂ report.
 *
 * Rendered server-side in the /api/report/[year] route handler.
 * Contains: header, company info, CO₂ results (Scope 1 / 2 / Total),
 * methodology note, and generation timestamp.
 *
 * Styles use React-PDF's StyleSheet — Tailwind CSS is NOT available here
 * because React-PDF renders to a PDF canvas, not HTML.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register a standard font for consistent cross-platform rendering
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
  },
  // Header
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brand: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  brandTagline: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    textAlign: 'right',
    fontSize: 9,
    color: '#6b7280',
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
    paddingBottom: 4,
  },
  // Company info
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  companyMeta: {
    fontSize: 9,
    color: '#6b7280',
  },
  // Result rows
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 4,
  },
  resultRowEven: {
    backgroundColor: '#f0fdf4',
  },
  resultRowOdd: {
    backgroundColor: '#f9fafb',
  },
  resultLabel: {
    fontSize: 10,
    color: '#374151',
  },
  resultValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  // Total hero
  totalBox: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#dcfce7',
  },
  totalValue: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  totalUnit: {
    fontSize: 10,
    color: '#dcfce7',
    marginTop: 2,
  },
  // Methodology note
  methodNote: {
    fontSize: 8,
    color: '#9ca3af',
    lineHeight: 1.5,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

interface ReportDocumentProps {
  company: {
    name: string;
    branche: string;
    mitarbeiter: number;
    standort: string;
  };
  entry: {
    year: number;
    stromKwh: number;
    erdgasM3: number;
    dieselL: number;
    heizoeL: number;
    co2Scope1T: number;
    co2Scope2T: number;
    co2TotalT: number;
  };
  generatedAt: Date;
}

export default function ReportDocument({ company, entry, generatedAt }: ReportDocumentProps) {
  const dateStr = generatedAt.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document
      title={`GrünBilanz CO₂-Bericht ${entry.year} – ${company.name}`}
      author="GrünBilanz"
      subject={`CO₂-Fußabdruck ${entry.year}`}
      creator="GrünBilanz"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>GrünBilanz</Text>
            <Text style={styles.brandTagline}>CO₂-Fußabdruck für Handwerksbetriebe</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>CO₂-Bericht {entry.year}</Text>
            <Text>Erstellt am {dateStr}</Text>
          </View>
        </View>

        {/* Company info */}
        <View style={styles.section}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyMeta}>
            Branche: {company.branche} · Mitarbeiter: {company.mitarbeiter} · Standort:{' '}
            {company.standort}
          </Text>
        </View>

        {/* Total hero */}
        <View style={styles.totalBox}>
          <View>
            <Text style={styles.totalLabel}>Gesamtemissionen {entry.year}</Text>
            <Text style={styles.totalUnit}>Tonnen CO₂e</Text>
          </View>
          <Text style={styles.totalValue}>{entry.co2TotalT.toFixed(2)}</Text>
        </View>

        {/* Scope breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CO₂-Emissionen nach Scope</Text>

          <View style={[styles.resultRow, styles.resultRowEven]}>
            <Text style={styles.resultLabel}>Scope 1 – Direkte Emissionen</Text>
            <Text style={styles.resultValue}>{entry.co2Scope1T.toFixed(3)} t CO₂e</Text>
          </View>
          <View style={[styles.resultRow, styles.resultRowOdd]}>
            <Text style={styles.resultLabel}>Scope 2 – Strom (indirekt)</Text>
            <Text style={styles.resultValue}>{entry.co2Scope2T.toFixed(3)} t CO₂e</Text>
          </View>
        </View>

        {/* Energy inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energieverbrauch {entry.year}</Text>

          <View style={[styles.resultRow, styles.resultRowEven]}>
            <Text style={styles.resultLabel}>Stromverbrauch (Scope 2)</Text>
            <Text style={styles.resultValue}>
              {entry.stromKwh.toLocaleString('de-DE')} kWh
            </Text>
          </View>
          <View style={[styles.resultRow, styles.resultRowOdd]}>
            <Text style={styles.resultLabel}>Erdgas (Scope 1)</Text>
            <Text style={styles.resultValue}>
              {entry.erdgasM3.toLocaleString('de-DE')} m³
            </Text>
          </View>
          <View style={[styles.resultRow, styles.resultRowEven]}>
            <Text style={styles.resultLabel}>Diesel (Scope 1)</Text>
            <Text style={styles.resultValue}>
              {entry.dieselL.toLocaleString('de-DE')} L
            </Text>
          </View>
          <View style={[styles.resultRow, styles.resultRowOdd]}>
            <Text style={styles.resultLabel}>Heizöl (Scope 1)</Text>
            <Text style={styles.resultValue}>
              {entry.heizoeL.toLocaleString('de-DE')} L
            </Text>
          </View>
        </View>

        {/* Methodology note */}
        <Text style={styles.methodNote}>
          Berechnungsmethodik: GHG Protocol Corporate Standard, Scope 1 &amp; 2.{'\n'}
          Emissionsfaktoren: Umweltbundesamt (UBA), Ausgabe 2024.{'\n'}
          Strom: 0,380 kg CO₂e/kWh (deutscher Strommix) · Erdgas: 2,0 kg CO₂e/m³ ·
          Diesel: 2,65 kg CO₂e/L · Heizöl: 2,68 kg CO₂e/L.{'\n'}
          Dieser Bericht dient zur internen Dokumentation. Für externe Berichtspflichten
          empfehlen wir eine Prüfung durch einen zertifizierten Gutachter.
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>GrünBilanz — gruenbilanz.de</Text>
          <Text>
            {company.name} · CO₂-Bericht {entry.year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
