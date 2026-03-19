/**
 * CSRD questionnaire PDF document for GrünBilanz.
 * Generates a pre-filled CSRD (Corporate Sustainability Reporting Directive)
 * questionnaire based on the company's emission data.
 * Helps German SMEs prepare for mandatory CSRD reporting from 2026.
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface CsrdProps {
  companyName: string;
  industry: string;
  location: string;
  employeeCount: number;
  year: number;
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
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1d4ed8',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#2563eb',
    marginBottom: 4,
  },
  euLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  section: {
    marginTop: 14,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 8,
    backgroundColor: '#eff6ff',
    padding: 5,
    borderRadius: 3,
  },
  questionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
  },
  questionNum: {
    width: '8%',
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
  questionText: {
    width: '45%',
    fontSize: 9,
    color: '#374151',
  },
  answerBox: {
    width: '47%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
    padding: 4,
    fontSize: 9,
    color: '#111827',
    fontFamily: 'Helvetica-Bold',
  },
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
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 4,
    padding: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 8,
    color: '#1e40af',
  },
});

export function CsrdDocument({
  companyName,
  industry,
  location,
  employeeCount,
  year,
  totalScope1,
  totalScope2,
  totalScope3,
}: CsrdProps) {
  const totalAll = totalScope1 + totalScope2 + totalScope3;
  const fmt = (kg: number) => (kg / 1000).toFixed(2).replace('.', ',') + ' t CO₂e';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CSRD-Fragebogen – Klimabezogene Angaben</Text>
          <Text style={styles.subtitle}>
            ESRS E1 – Klimawandel · {companyName} · Berichtsjahr {year}
          </Text>
          <Text style={styles.euLabel}>
            Gemäß EU-Richtlinie 2022/2464 (CSRD) · European Sustainability Reporting Standards (ESRS)
          </Text>
        </View>

        {/* Section 1: Company info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Allgemeine Unternehmensangaben</Text>
          {[
            { num: '1.1', q: 'Unternehmensname', a: companyName },
            { num: '1.2', q: 'Branche / Sektor', a: industry },
            { num: '1.3', q: 'Standort (Hauptsitz)', a: location },
            { num: '1.4', q: 'Anzahl Beschäftigte', a: `${employeeCount} Mitarbeiter` },
            { num: '1.5', q: 'Berichtszeitraum', a: `01.01.${year} – 31.12.${year}` },
            { num: '1.6', q: 'Berichtsstandard', a: 'GHG Protocol Corporate Standard' },
          ].map(({ num, q, a }) => (
            <View key={num} style={styles.questionRow}>
              <Text style={styles.questionNum}>{num}</Text>
              <Text style={styles.questionText}>{q}</Text>
              <Text style={styles.answerBox}>{a}</Text>
            </View>
          ))}
        </View>

        {/* Section 2: GHG Emissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Treibhausgasemissionen (ESRS E1-6)</Text>
          {[
            { num: '2.1', q: 'Scope 1 – Direkte Emissionen (stationäre und mobile Verbrennung)', a: fmt(totalScope1) },
            { num: '2.2', q: 'Scope 2 – Indirekte Emissionen (eingekaufte Energie)', a: fmt(totalScope2) },
            { num: '2.3', q: 'Scope 3 – Sonstige indirekte Emissionen (Wertschöpfungskette)', a: fmt(totalScope3) },
            { num: '2.4', q: 'Gesamtemissionen (Scope 1 + 2 + 3)', a: fmt(totalAll) },
            { num: '2.5', q: 'Emissionen je Mitarbeiter', a: fmt(totalAll / employeeCount) + '/MA' },
          ].map(({ num, q, a }) => (
            <View key={num} style={styles.questionRow}>
              <Text style={styles.questionNum}>{num}</Text>
              <Text style={styles.questionText}>{q}</Text>
              <Text style={styles.answerBox}>{a}</Text>
            </View>
          ))}
        </View>

        {/* Section 3: Climate targets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Klimaziele und Maßnahmen (ESRS E1-4)</Text>
          {[
            { num: '3.1', q: 'Existiert ein Klimaschutzprogramm?', a: '☐ Ja  ☑ In Planung' },
            { num: '3.2', q: 'Reduktionsziel (Scope 1+2)', a: '_____________ % bis _______' },
            { num: '3.3', q: 'Reduktionsziel (Scope 3)', a: '_____________ % bis _______' },
            { num: '3.4', q: 'Nutzung erneuerbarer Energien', a: '☐ Ja  ☐ Nein  ☐ Geplant' },
          ].map(({ num, q, a }) => (
            <View key={num} style={styles.questionRow}>
              <Text style={styles.questionNum}>{num}</Text>
              <Text style={styles.questionText}>{q}</Text>
              <Text style={styles.answerBox}>{a}</Text>
            </View>
          ))}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️  Hinweis: Dieser Fragebogen basiert auf ESRS E1 (Klimawandel) der Corporate
            Sustainability Reporting Directive (CSRD). Für Unternehmen mit &lt; 250 Mitarbeitern
            gilt die CSRD ab dem Geschäftsjahr 2026 (vereinfachte VSME-Standards).
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>GrünBilanz – CSRD-Fragebogen ESRS E1</Text>
          <Text>
            {companyName} · {year}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
