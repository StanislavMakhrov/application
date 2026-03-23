/**
 * GET /api/field-documents?fieldKey=ERDGAS&year=2024
 * POST /api/field-documents — multipart form upload
 *
 * Stores uploaded files in /uploads/{year}/{fieldKey}/ (inside public/ for Next.js serving).
 * Each (fieldKey, year) pair has at most one document; uploading again replaces the previous.
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
  const doc = await prisma.fieldDocument.findUnique({
    where: { fieldKey_year: { fieldKey, year: parseInt(year, 10) } },
  });
  return NextResponse.json(doc ?? null);
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
    const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') ?? 'bin';
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const filename = `${base}.${ext}`;
    const filePath = path.join(uploadPath, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const relPath = `/uploads/${year}/${fieldKey}/${filename}`;

    const doc = await prisma.fieldDocument.upsert({
      where: { fieldKey_year: { fieldKey, year: yearNum } },
      update: { filePath: relPath, originalFilename: file.name, mimeType: file.type },
      create: { fieldKey, year: yearNum, filePath: relPath, originalFilename: file.name, mimeType: file.type },
    });

    return NextResponse.json(doc);
  } catch (err) {
    console.error('field-documents POST error:', err);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }
}
