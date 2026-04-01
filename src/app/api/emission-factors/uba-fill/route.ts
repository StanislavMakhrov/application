/**
 * POST /api/emission-factors/uba-fill
 *
 * Stub — UBA auto-fill is not yet implemented.
 * UBA values are managed exclusively in the database and are not bundled
 * as hardcoded source-code data.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'UBA-Werte automatisch übernehmen ist noch nicht verfügbar.' },
    { status: 501 }
  );
}
