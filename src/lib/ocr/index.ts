/**
 * OCR stub for GrünBilanz.
 *
 * In production this would call the Tesseract microservice to extract
 * numeric values from uploaded utility bills. The stub simulates the
 * API contract so the wizard UI can be developed and tested without
 * a running OCR service.
 *
 * TODO: Replace stub body with actual HTTP call to TESSERACT_URL when
 * the OCR microservice is integrated.
 */

export interface OcrResult {
  value: number;
  unit: string;
  confidence: number;
}

/**
 * Extracts a numeric consumption value from an uploaded document.
 * Simulates a 1–2 second OCR processing delay.
 *
 * @param file - The uploaded PDF or image file
 * @param category - The EmissionCategory the document belongs to
 * @returns Extracted value, its unit, and OCR confidence (0–1)
 */
export async function extractFromFile(
  _file: File,
  category: string
): Promise<OcrResult> {
  // Simulate realistic OCR processing latency
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

  // Stub values representative of a mid-sized Elektrohandwerk company
  const stubs: Record<string, { value: number; unit: string }> = {
    STROM: { value: 45000, unit: 'kWh' },
    ERDGAS: { value: 8500, unit: 'm³' },
    DIESEL_FUHRPARK: { value: 3200, unit: 'L' },
    HEIZOEL: { value: 2800, unit: 'L' },
    FLUESSIGGAS: { value: 450, unit: 'kg' },
    FERNWAERME: { value: 12000, unit: 'kWh' },
    GESCHAEFTSREISEN_FLUG: { value: 8500, unit: 'km' },
    GESCHAEFTSREISEN_BAHN: { value: 3200, unit: 'km' },
    KUPFER: { value: 480, unit: 'kg' },
  };

  const stub = stubs[category] ?? { value: 1000, unit: 'Einheit' };
  return { ...stub, confidence: 0.87 };
}
