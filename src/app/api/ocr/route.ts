/**
 * POST /api/ocr — processes an uploaded file through the OCR stub.
 *
 * Accepts multipart/form-data with:
 * - file: the uploaded PDF/image
 * - category: the EmissionCategory to extract for
 *
 * Returns: { value, unit, confidence }
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractFromFile } from '@/lib/ocr';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;

    if (!file || !category) {
      return NextResponse.json(
        { error: 'Datei und Kategorie sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await extractFromFile(file, category);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'OCR Verarbeitung fehlgeschlagen' }, { status: 500 });
  }
}
