/**
 * CSRD Questionnaire PDF for GrünBilanz.
 *
 * A structured questionnaire format for banks and Großkunden,
 * summarizing the company's GHG data in a standardized form.
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { CO2eTotals, CompanyProfileData } from '@/types';
import { BRANCHE_LABELS } from '@/types';
import type { Branche } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 20 },
  section: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 12 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#2D6A4F', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: '45%', color: '#555', fontSize: 9 },
  value: { width: '55%', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#aaa', textAlign: 'center' },
});

interface CSRDQuestionnaireProps {
  profile: CompanyProfileData;
  year: number;
  totals: CO2eTotals;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function CSRDQuestionnaire({ profile, year, totals }: CSRDQuestionnaireProps) {
  const co2ePerEmployee = profile.mitarbeiter > 0 ? totals.total / profile.mitarbeiter : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CSRD-Fragebogen — ESG-Basisdaten</Text>
        <Text style={styles.subtitle}>
          Ausgefüllt von: {profile.firmenname} · Berichtsjahr: {year} ·
          Erstellt: {new Date().toLocaleDateString('de-DE')}
        </Text>

        {/* Company Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Unternehmensdaten</Text>
          <Row label="Unternehmensname" value={profile.firmenname} />
          <Row label="Branche" value={BRANCHE_LABELS[profile.branche as Branche] ?? profile.branche} />
          <Row label="Hauptstandort" value={profile.standort} />
          <Row label="Anzahl Mitarbeitende" value={String(profile.mitarbeiter)} />
          <Row label="Berichtsjahr" value={String(year)} />
          <Row label="Berichtszeitraum" value={`01.01.${year} – 31.12.${year}`} />
          <Row label="Berichtsstandard" value="GHG Protocol Corporate Standard / ESRS E1" />
        </View>

        {/* GHG Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Treibhausgasemissionen (CO₂-Äquivalente)</Text>
          <Row label="Scope 1 — Direkte Emissionen" value={`${totals.scope1.toFixed(2)} t CO₂e`} />
          <Row label="Scope 2 — Energiebedingte indirekte Emissionen" value={`${totals.scope2.toFixed(2)} t CO₂e`} />
          <Row label="Scope 3 — Sonstige indirekte Emissionen" value={`${totals.scope3.toFixed(2)} t CO₂e`} />
          <Row label="  davon Kat. 1 (Eingekaufte Waren)" value="siehe Anhang" />
          <Row label="  davon Kat. 5 (Abfallentsorgung)" value="in Scope 3 enthalten" />
          <Row label="  davon Kat. 6 (Dienstreisen)" value="in Scope 3 enthalten" />
          <Row label="  davon Kat. 7 (Pendlerverkehr)" value="in Scope 3 enthalten" />
          <Row label="Gesamt CO₂e" value={`${totals.total.toFixed(2)} t CO₂e`} />
          <Row label="CO₂e pro Mitarbeiter" value={`${co2ePerEmployee.toFixed(2)} t CO₂e/MA`} />
        </View>

        {/* Methodology */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Methodik & Datenquellen</Text>
          <Row label="Berechnungsmethode" value="Aktivitätsdaten × Emissionsfaktor" />
          <Row label="Emissionsfaktoren" value="UBA 2024 (Umweltbundesamt)" />
          <Row label="Systemgrenzen" value="Scope 1, 2, 3 (Kat. 1, 5, 6, 7)" />
          <Row label="Organisationsgrenze" value="Operational-Control-Ansatz" />
          <Row label="Berichtsstandard (GHG)" value="GHG Protocol Corporate Standard" />
          <Row label="Berichtsstandard (ESG)" value="ESRS E1 — Klimawandel (EU 2023/2772)" />
          <Row label="Software" value="GrünBilanz" />
        </View>

        {/* Attestation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Bestätigung</Text>
          <Text style={{ fontSize: 9, color: '#555', lineHeight: 1.6, marginBottom: 20 }}>
            Die oben genannten Daten wurden nach bestem Wissen und Gewissen ermittelt und
            entsprechen den Vorgaben des GHG Protocol Corporate Standard sowie den
            Emissionsfaktoren des Umweltbundesamtes (UBA 2024).
          </Text>
          <Row label="Datum" value="____________________________" />
          <Row label="Unterschrift" value="____________________________" />
          <Row label="Funktion" value="____________________________" />
        </View>

        <Text style={styles.footer}>
          GrünBilanz · CSRD-Fragebogen · Berichtsjahr {year} · {profile.firmenname}
        </Text>
      </Page>
    </Document>
  );
}
