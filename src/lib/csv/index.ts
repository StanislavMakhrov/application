/**
 * CSV import stub for GrünBilanz.
 *
 * In production this would parse the uploaded CSV/XLSX file, apply the
 * user's column→category mapping, and return the summed values. The stub
 * returns hardcoded values so the wizard UI can be developed and tested
 * without a real file parser.
 *
 * TODO: Replace stub body with actual CSV/XLSX parsing (e.g. papaparse)
 * when full CSV import is implemented.
 */

/** Maps CSV column headers to EmissionCategory keys */
export type CsvMapping = Record<string, string>;

/**
 * Imports consumption values from a CSV file using a column mapping.
 *
 * @param file - The uploaded .csv or .xlsx file
 * @param mapping - Column header → EmissionCategory mapping
 * @returns Record of EmissionCategory → total quantity
 */
export async function importFromCsv(
  _file: File,
  mapping: CsvMapping
): Promise<Record<string, number>> {
  // Stub values matching the OCR stub for consistency during development
  const stubs: Record<string, number> = {
    STROM: 45000,
    ERDGAS: 8500,
    DIESEL_FUHRPARK: 3200,
    HEIZOEL: 2800,
    FLUESSIGGAS: 450,
    FERNWAERME: 12000,
    GESCHAEFTSREISEN_FLUG: 8500,
    GESCHAEFTSREISEN_BAHN: 3200,
    KUPFER: 480,
  };

  const result: Record<string, number> = {};
  for (const category of Object.values(mapping)) {
    if (stubs[category] !== undefined) {
      result[category] = stubs[category];
    }
  }
  return result;
}
