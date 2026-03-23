/**
 * GET /api/audit?yearId=X&entityType=EmissionEntry&category=ERDGAS&limit=5
 *
 * Returns audit log entries for a given year (optional), entity type (optional),
 * and one or more categories (optional), newest first.
 *
 * The `category` parameter can be provided multiple times to filter by multiple
 * categories — entries whose metadata JSON contains any of the supplied categories
 * are returned. `limit` caps the number of results (default 50, max 200).
 *
 * Each entry includes the linked document filename so the client can show
 * a download link without a second request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const yearIdRaw = searchParams.get('yearId');
    const entityType = searchParams.get('entityType');
    const categoryParams = searchParams.getAll('category');
    const limitRaw = searchParams.get('limit');
    const take = limitRaw ? Math.min(parseInt(limitRaw, 10) || 50, 200) : 50;

    // Build the dynamic where clause — all filters are optional.
    // We use a plain object to avoid relying on generated Prisma types
    // that may not be available before `prisma generate` runs.
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;

    // When filtering by year we must join through the EmissionEntry relation
    // because AuditLog has no direct reportingYearId column.
    const yearConditions: Record<string, unknown>[] = [];
    if (yearIdRaw) {
      const yearId = parseInt(yearIdRaw, 10);
      if (!isNaN(yearId)) {
        yearConditions.push(
          { emissionEntry: { reportingYearId: yearId } },
          { materialEntry: { reportingYearId: yearId } }
        );
      }
    }

    // Filter by category via metadata JSON containment check.
    // Metadata is stored as {"category":"ERDGAS",...} so we search for the quoted key.
    const categoryConditions: Record<string, unknown>[] = categoryParams.map((cat) => ({
      metadata: { contains: `"${cat}"` },
    }));

    // Combine year and category filters using AND/OR logic
    if (yearConditions.length > 0 && categoryConditions.length > 0) {
      where.AND = [
        { OR: yearConditions },
        { OR: categoryConditions },
      ];
    } else if (yearConditions.length > 0) {
      where.OR = yearConditions;
    } else if (categoryConditions.length > 0) {
      where.OR = categoryConditions;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        document: { select: { id: true, filename: true, mimeType: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: 'Audit-Protokoll konnte nicht geladen werden' }, { status: 500 });
  }
}


