/**
 * GET /api/audit?yearId=X&entityType=EmissionEntry
 *
 * Returns the 50 most recent audit log entries for a given year (optional)
 * and entity type (optional), newest first.
 *
 * Each entry includes the linked document filename so the client can show
 * a download link without a second request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const yearIdRaw = searchParams.get('yearId');
    const entityType = searchParams.get('entityType');

    // Build the dynamic where clause — both filters are optional
    const where: Prisma.AuditLogWhereInput = {};
    if (entityType) where.entityType = entityType;

    // When filtering by year we must join through the EmissionEntry relation
    // because AuditLog has no direct reportingYearId column. We use the
    // emissionEntryId → EmissionEntry → reportingYearId path.
    if (yearIdRaw) {
      const yearId = parseInt(yearIdRaw, 10);
      if (!isNaN(yearId)) {
        where.OR = [
          { emissionEntry: { reportingYearId: yearId } },
          { materialEntry: { reportingYearId: yearId } },
        ];
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        document: { select: { id: true, filename: true, mimeType: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: 'Audit-Protokoll konnte nicht geladen werden' }, { status: 500 });
  }
}
