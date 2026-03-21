/**
 * POST /api/csv — processes an uploaded CSV file through the CSV import stub.
 *
 * Accepts multipart/form-data with:
 * - file: the uploaded .csv/.xlsx file
 * - mapping: JSON string of { columnHeader: EmissionCategory }
 *
 * Returns: { values: Record<EmissionCategory, number> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { importFromCsv } from '@/lib/csv';
import type { CsvMapping } from '@/lib/csv';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mappingRaw = formData.get('mapping') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Datei ist erforderlich' }, { status: 400 });
    }

    const mapping: CsvMapping = mappingRaw ? JSON.parse(mappingRaw) : {};
    const values = await importFromCsv(file, mapping);
    return NextResponse.json({ values });
  } catch {
    return NextResponse.json({ error: 'CSV-Import fehlgeschlagen' }, { status: 500 });
  }
}
