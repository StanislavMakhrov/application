/**
 * DELETE /api/field-documents/[id]
 *
 * Removes a single FieldDocument by its primary-key ID.
 * The file is deleted from the filesystem before the database record is removed;
 * missing files are silently ignored (delete is idempotent on the filesystem).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

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
