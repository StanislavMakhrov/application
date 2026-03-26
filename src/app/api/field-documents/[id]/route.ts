/**
 * DELETE /api/field-documents/[id]
 *
 * Removes a single FieldDocument by its primary-key ID.
 * The file is deleted from the filesystem before the database record is removed;
 * missing files are silently ignored (delete is idempotent on the filesystem).
 *
 * PATCH /api/field-documents/[id]
 *
 * Updates per-invoice metadata (billingMonth, isJahresabrechnung) without
 * touching the underlying file. Used by FieldDocumentZone when the user
 * changes the month dropdown or toggles the Jahresabrechnung checkbox.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }

  let body: { billingMonth?: number | null; isJahresabrechnung?: boolean };
  try {
    body = await req.json() as { billingMonth?: number | null; isJahresabrechnung?: boolean };
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 });
  }

  // Validate billingMonth when present: must be null or an integer in 1–12
  if (body.billingMonth !== undefined && body.billingMonth !== null) {
    const m = body.billingMonth;
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: 'billingMonth muss 1–12 oder null sein' }, { status: 400 });
    }
  }

  const doc = await prisma.fieldDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
  }

  const updated = await prisma.fieldDocument.update({
    where: { id },
    data: {
      // Only update fields explicitly included in the request body
      ...(body.billingMonth !== undefined && { billingMonth: body.billingMonth }),
      ...(body.isJahresabrechnung !== undefined && { isJahresabrechnung: body.isJahresabrechnung }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
  }

  const doc = await prisma.fieldDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
  }

  // Remove the physical file; tolerate missing files (already cleaned up or never written).
  const fsPath = path.join(process.cwd(), 'public', doc.filePath);
  await unlink(fsPath).catch(() => {
    // File may have been manually deleted or never written — safe to continue.
  });

  await prisma.fieldDocument.delete({ where: { id } });

  // 204 No Content — deletion was successful
  return new NextResponse(null, { status: 204 });
}
