/**
 * Static German display label fallback for emission factor keys.
 *
 * Used when a factor's `label` DB field is NULL — which can occur for rows
 * created before the Task 1 migration added the column.
 *
 * Priority for resolving a factor's label:
 * 1. DB `label` field (populated by seed / uba-fill)
 * 2. This FACTOR_LABELS map
 * 3. Raw key string (last resort)
 */

export const FACTOR_LABELS: Record<string, string> = {
  // Scope 1 — Combustion
  ERDGAS: 'Erdgas',
  HEIZOEL: 'Heizöl',
  FLUESSIGGAS: 'Flüssiggas (LPG)',
  DIESEL_FUHRPARK: 'Diesel (Fuhrpark)',
  BENZIN_FUHRPARK: 'Benzin (Fuhrpark)',
  PKW_BENZIN_KM: 'PKW Benzin (km)',
  PKW_DIESEL_KM: 'PKW Diesel (km)',
  TRANSPORTER_KM: 'Transporter (km)',
  LKW_KM: 'LKW (km)',
  // Refrigerants
  R410A_KAELTEMITTEL: 'R410A Kältemittel',
  R32_KAELTEMITTEL: 'R32 Kältemittel',
  R134A_KAELTEMITTEL: 'R134A Kältemittel',
  SONSTIGE_KAELTEMITTEL: 'Sonstige Kältemittel',
  // Scope 2 — Energy
  STROM: 'Strom (Netzstrom)',
  STROM_OEKOSTROM: 'Strom (Ökostrom)',
  FERNWAERME: 'Fernwärme',
  // Scope 3 — Travel & waste
  GESCHAEFTSREISEN_FLUG: 'Geschäftsreisen Flug',
  GESCHAEFTSREISEN_BAHN: 'Geschäftsreisen Bahn',
  PENDLERVERKEHR: 'Pendlerverkehr',
  ABFALL_RESTMUELL: 'Abfall Restmüll',
  ABFALL_BAUSCHUTT: 'Abfall Bauschutt',
  ABFALL_ALTMETALL: 'Abfall Altmetall (Recycling)',
  ABFALL_SONSTIGES: 'Abfall Sonstiges',
  // Materials (Scope 3, Cat. 1)
  KUPFER: 'Kupfer',
  STAHL: 'Stahl',
  ALUMINIUM: 'Aluminium',
  HOLZ: 'Holz',
  KUNSTSTOFF_PVC: 'Kunststoff / PVC',
  BETON: 'Beton',
  FARBEN_LACKE: 'Farben & Lacke',
  SONSTIGE: 'Sonstige Materialien',
};
