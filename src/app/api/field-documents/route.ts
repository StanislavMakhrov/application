/**
 * GET /api/field-documents?fieldKey=ERDGAS&year=2024
 * POST /api/field-documents — multipart form upload
 *
 * Stores uploaded files in /uploads/{year}/{fieldKey}/ (inside public/ for Next.js serving).
 * Multiple documents are allowed per (fieldKey, year) — each upload appends a new record
 * rather than replacing the previous one.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const fieldKey = searchParams.get('fieldKey');
  const year = searchParams.get('year');
  if (!fieldKey || !year) {
    return NextResponse.json({ error: 'fieldKey und year sind erforderlich' }, { status: 400 });
  }
  // Return all documents for this field/year, ordered oldest-first so the UI
  // displays them in chronological upload order.
  const docs = await prisma.fieldDocument.findMany({
    where: { fieldKey, year: parseInt(year, 10) },
    orderBy: { uploadedAt: 'asc' },
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fieldKey = formData.get('fieldKey') as string | null;
    const year = formData.get('year') as string | null;

    if (!file || !fieldKey || !year) {
      return NextResponse.json({ error: 'file, fieldKey und year sind erforderlich' }, { status: 400 });
    }

    const yearNum = parseInt(year, 10);
    const uploadPath = path.join(UPLOAD_DIR, year, fieldKey);
    await mkdir(uploadPath, { recursive: true });

    // Sanitise filename to prevent path traversal and double-extension attacks.
    // Keep only alphanumeric, hyphens, and underscores; replace dot separators with underscores
    // then append the original extension to ensure a single safe extension.
    // A timestamp prefix ensures uniqueness when multiple files share the same name.
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'bin';
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const filename = `${Date.now()}_${base}.${ext}`;
    const filePath = path.join(uploadPath, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const relPath = `/uploads/${year}/${fieldKey}/${filename}`;

    // Append a new document record — no upsert, since multiple docs per field/year
    // are now supported (unique constraint removed in migration 20260325000000).
    const doc = await prisma.fieldDocument.create({
      data: { fieldKey, year: yearNum, filePath: relPath, originalFilename: file.name, mimeType: file.type },
    });

    return NextResponse.json(doc);
  } catch (err) {
    console.error('field-documents POST error:', err);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }
}
