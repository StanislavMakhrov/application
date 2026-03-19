import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { getCompanyByUserId } from '@/services/companies';
import { upsertEnergyEntry } from '@/services/energy-entries';
import { calculateEmissions } from '@/lib/calculator';
import { z } from 'zod';

const energySchema = z.object({
  year: z.number().int().min(2000).max(2100),
  strom_kwh: z.number().min(0, 'Wert darf nicht negativ sein'),
  erdgas_m3: z.number().min(0),
  diesel_l: z.number().min(0),
  heizoel_l: z.number().min(0),
});

/** POST /api/energy — save energy entry and calculated CO₂ values */
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    const body = await request.json().catch(() => ({}));
    const parsed = energySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 });
    }
    const emissions = calculateEmissions(parsed.data);
    return NextResponse.json({ success: true, demo: true, emissions, year: parsed.data.year });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Datenbankverbindung nicht verfügbar' }, { status: 503 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const company = await getCompanyByUserId(supabase, session.user.id);
  if (!company) {
    return NextResponse.json({ error: 'Unternehmensprofil nicht gefunden' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = energySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 }
    );
  }

  const entry = await upsertEnergyEntry(supabase, {
    company_id: company.id,
    ...parsed.data,
  });

  return NextResponse.json({ entry, success: true });
}
