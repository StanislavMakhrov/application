/**
 * POST /api/ocr — processes an uploaded file through the OCR stub.
 *
 * Accepts multipart/form-data with:
 * - file: the uploaded PDF/image
 * - category: the EmissionCategory to extract for
 * - fieldKey (optional): if provided together with year, creates a FieldDocument
 * - year (optional): reporting year for the FieldDocument
 *
 * Returns: { value, unit, confidence, documentId, fieldDocumentId? }
 * documentId links the source document stored in UploadedDocument for audit purposes.
 * fieldDocumentId (when present) links the stored FieldDocument evidence attachment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractFromFile } from '@/lib/ocr';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string | null;
    // Optional: when both are supplied, also persist the file as a FieldDocument
    const fieldKey = formData.get('fieldKey') as string | null;
    const yearStr = formData.get('year') as string | null;

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

    // If fieldKey + year are provided, also write the file to the filesystem and
    // create a FieldDocument record so the OCR upload doubles as invoice storage.
    // This eliminates the need for a separate "Rechnung hochladen" button in
    // FieldDocumentZone when UploadOCR is already present for the same field.
    let fieldDocumentId: number | undefined;
    if (fieldKey && yearStr) {
      const yearNum = parseInt(yearStr, 10);
      if (!isNaN(yearNum)) {
        try {
          const uploadPath = path.join(UPLOAD_DIR, yearStr, fieldKey);
          await mkdir(uploadPath, { recursive: true });

          // Sanitise filename (same rules as /api/field-documents) + timestamp prefix for uniqueness
          const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'bin';
          const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
          const filename = `${Date.now()}_${base}.${ext}`;
          const filePath = path.join(uploadPath, filename);
          await writeFile(filePath, Buffer.from(fileBytes));

          const relPath = `/uploads/${yearStr}/${fieldKey}/${filename}`;
          const fieldDoc = await prisma.fieldDocument.create({
            data: {
              fieldKey,
              year: yearNum,
              filePath: relPath,
              originalFilename: file.name,
              mimeType: file.type || 'application/octet-stream',
            },
          });
          fieldDocumentId = fieldDoc.id;
        } catch (fieldDocErr) {
          // FieldDocument creation is best-effort; OCR result is still returned
          console.error('OCR: FieldDocument creation failed:', fieldDocErr);
        }
      }
    }

    return NextResponse.json({ ...result, documentId: uploadedDoc.id, fieldDocumentId });
  } catch {
    return NextResponse.json({ error: 'OCR Verarbeitung fehlgeschlagen' }, { status: 500 });
  }
}
