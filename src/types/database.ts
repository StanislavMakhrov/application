/**
 * TypeScript type definitions for the Supabase PostgreSQL schema.
 *
 * These types are used by the Supabase client to provide full type-safety
 * for all database operations. Keep in sync with supabase/schema.sql.
 *
 * Structured to match the GenericSchema constraint from
 * @supabase/postgrest-js (Tables, Views, Functions).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          branche: string;
          mitarbeiter: number;
          standort: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          branche: string;
          mitarbeiter: number;
          standort: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          branche?: string;
          mitarbeiter?: number;
          standort?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      energy_entries: {
        Row: {
          id: string;
          company_id: string;
          year: number;
          strom_kwh: number;
          erdgas_m3: number;
          diesel_l: number;
          heizoel_l: number;
          co2_scope1_t: number;
          co2_scope2_t: number;
          co2_total_t: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          year: number;
          strom_kwh: number;
          erdgas_m3: number;
          diesel_l: number;
          heizoel_l: number;
          co2_scope1_t: number;
          co2_scope2_t: number;
          co2_total_t: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          year?: number;
          strom_kwh?: number;
          erdgas_m3?: number;
          diesel_l?: number;
          heizoel_l?: number;
          co2_scope1_t?: number;
          co2_scope2_t?: number;
          co2_total_t?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'energy_entries_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};
