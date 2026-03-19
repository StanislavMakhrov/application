-- GrünBilanz database schema
-- Apply this file in your Supabase SQL editor to set up the database.
-- Supabase project must be in EU region (eu-central-1 / Frankfurt) for DSGVO compliance.

-- Companies table
-- One record per authenticated user, created during the onboarding flow.
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  branche TEXT NOT NULL,
  mitarbeiter INTEGER NOT NULL CHECK (mitarbeiter > 0),
  standort TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Energy entries table
-- One record per company per year. Stores both raw consumption figures and
-- pre-computed CO₂ values (avoids re-computation on every page load).
CREATE TABLE IF NOT EXISTS energy_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  strom_kwh NUMERIC NOT NULL DEFAULT 0 CHECK (strom_kwh >= 0),
  erdgas_m3 NUMERIC NOT NULL DEFAULT 0 CHECK (erdgas_m3 >= 0),
  diesel_l NUMERIC NOT NULL DEFAULT 0 CHECK (diesel_l >= 0),
  heizoel_l NUMERIC NOT NULL DEFAULT 0 CHECK (heizoel_l >= 0),
  co2_scope1_t NUMERIC NOT NULL DEFAULT 0,
  co2_scope2_t NUMERIC NOT NULL DEFAULT 0,
  co2_total_t NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, year)
);

-- Row-Level Security
-- Ensures strict tenant isolation: one user cannot read or modify another
-- company's data even if they share the same Supabase project.
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company"
  ON companies FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their company's energy entries"
  ON energy_entries FOR ALL
  USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));
