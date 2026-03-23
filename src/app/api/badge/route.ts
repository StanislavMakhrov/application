/**
 * GET /api/badge — returns a CO₂e badge for embedding in websites or emails.
 *
 * Query params:
 * - yearId: number — the reporting year
 * - format: "svg" | "png" (default: "svg")
 *
 * Returns:
 * - SVG/PNG badge image showing "Klimabilanz {year} — {total} t CO₂e"
 * - If format=html, returns an HTML embed snippet
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTotalCO2e } from '@/lib/emissions';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const yearIdStr = searchParams.get('yearId');
  const format = searchParams.get('format') ?? 'svg';

  if (!yearIdStr) {
    return NextResponse.json({ error: 'yearId ist erforderlich' }, { status: 400 });
  }

  const yearId = parseInt(yearIdStr, 10);

  const reportingYear = await prisma.reportingYear.findUnique({ where: { id: yearId } });
  if (!reportingYear) {
    return NextResponse.json({ error: 'Berichtsjahr nicht gefunden' }, { status: 404 });
  }

  const totals = await getTotalCO2e(yearId);
  const label = `Klimabilanz ${reportingYear.year} — ${totals.total.toFixed(1)} t CO₂e`;

  // SVG badge (shields.io style)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="28">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="260" height="28" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="100" height="28" fill="#2D6A4F"/>
    <rect x="100" width="160" height="28" fill="#52B788"/>
    <rect width="260" height="28" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="11">
    <text x="50" y="18" font-weight="bold">🌿 GrünBilanz</text>
    <text x="180" y="18">${label.split('—')[1]?.trim() ?? ''}</text>
  </g>
</svg>`;

  if (format === 'html') {
    const html = `<!-- GrünBilanz CO₂e Badge -->
<img src="${req.nextUrl.origin}/api/badge?yearId=${yearId}&format=svg" 
     alt="${label}" 
     style="height:28px;" />`;
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
