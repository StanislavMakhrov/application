/**
 * POST /api/ocr — processes an uploaded file through the OCR stub.
 *
 * Accepts multipart/form-data with:
 * - file: the uploaded PDF/image
 * - category: the EmissionCategory to extract for
 *
 * Returns: { value, unit, confidence, documentId }
 * documentId links the source document stored in UploadedDocument for audit purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractFromFile } from '@/lib/ocr';
import { prisma } from '@/lib/prisma';

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

    // Persist the original file so it can be downloaded later as audit evidence
    const fileBytes = await file.arrayBuffer();
    const uploadedDoc = await prisma.uploadedDocument.create({
      data: {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: fileBytes.byteLength,
        content: Buffer.from(fileBytes),
      },
    });

    const result = await extractFromFile(file, category);
    return NextResponse.json({ ...result, documentId: uploadedDoc.id });
  } catch {
    return NextResponse.json({ error: 'OCR Verarbeitung fehlgeschlagen' }, { status: 500 });
  }
}
