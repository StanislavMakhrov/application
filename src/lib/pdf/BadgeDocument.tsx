/**
 * Sustainability badge PDF document for GrünBilanz.
 * Generates a compact single-page badge showing the company's CO₂ performance
 * suitable for use on websites, email signatures, and marketing materials.
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface BadgeProps {
  companyName: string;
  year: number;
  totalCo2eKg: number;
  employeeCount: number;
  industry: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  card: {
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#14532d',
  },
  logoAccent: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  yearBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  yearText: {
    fontSize: 10,
    color: '#166534',
    fontFamily: 'Helvetica-Bold',
  },
  co2Block: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  co2Value: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  co2Unit: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  co2Label: {
    fontSize: 9,
    color: '#4b5563',
    marginTop: 4,
  },
  perEmployee: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    width: '100%',
    marginBottom: 10,
  },
  footer: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  certText: {
    fontSize: 8,
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
});

export function BadgeDocument({ companyName, year, totalCo2eKg, employeeCount, industry }: BadgeProps) {
  const totalTonnes = (totalCo2eKg / 1000).toFixed(1);
  const perEmployee = (totalCo2eKg / 1000 / employeeCount).toFixed(1);

  return (
    <Document>
      <Page size={[280, 320]} style={styles.page}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>Grün</Text>
            <Text style={styles.logoAccent}>Bilanz</Text>
          </View>

          <Text style={styles.companyName}>{companyName}</Text>

          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{year} · {industry}</Text>
          </View>

          {/* CO₂ total */}
          <View style={styles.co2Block}>
            <Text style={styles.co2Value}>{totalTonnes}</Text>
            <Text style={styles.co2Unit}>t CO₂e gesamt</Text>
            <Text style={styles.co2Label}>Scope 1 + 2 + 3 nach GHG-Protokoll</Text>
          </View>

          <Text style={styles.perEmployee}>
            ∅ {perEmployee} t CO₂e je Mitarbeiter ({employeeCount} Beschäftigte)
          </Text>

          <View style={styles.divider} />

          <Text style={styles.footer}>
            Berechnet nach UBA-Emissionsfaktoren 2024{'\n'}
            GHG Protocol Corporate Standard
          </Text>

          <View style={styles.certBadge}>
            <Text style={styles.certText}>✓ GrünBilanz-zertifiziert</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
