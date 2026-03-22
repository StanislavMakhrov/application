/**
 * GET /api/documents/[id]
 *
 * Streams the original uploaded document back to the client as a file
 * download. Used by the AuditLogPanel to let users retrieve the source
 * invoices or CSV files that were imported into GrünBilanz.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Ungültige Dokument-ID' }, { status: 400 });
  }

  const doc = await prisma.uploadedDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
  }

  // Return the raw bytes with the original MIME type and a download prompt
  return new NextResponse(new Uint8Array(doc.content), {
    headers: {
      'Content-Type': doc.mimeType,
      // Instruct the browser to save the file with the original filename
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
      'Content-Length': String(doc.sizeBytes),
    },
  });
}
