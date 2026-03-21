'use server';

/**
 * Server Actions for GrünBilanz.
 *
 * All actions follow the same response contract: { success: boolean; error?: string }.
 * They are called directly from client components via React Server Actions.
 *
 * Data validation is intentionally light here — Zod schemas live in the
 * wizard screen components. Server actions perform only database operations.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from './prisma';
import type { Scope, EmissionCategory, MaterialCategory, Branche, InputMethod } from '@/types';

type ActionResult = { success: boolean; error?: string };

// ─── Company Profile ─────────────────────────────────────────────────────────

export interface SaveCompanyProfileInput {
  firmenname: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
  logoPath?: string;
}

/**
 * Upserts the singleton company profile (id=1).
 * Called from Screen 1 (Firmenprofil) of the wizard.
 */
export async function saveCompanyProfile(input: SaveCompanyProfileInput): Promise<ActionResult> {
  try {
    await prisma.companyProfile.upsert({
      where: { id: 1 },
      update: {
        firmenname: input.firmenname,
        branche: input.branche,
        mitarbeiter: input.mitarbeiter,
        standort: input.standort,
        ...(input.logoPath !== undefined && { logoPath: input.logoPath }),
      },
      create: {
        id: 1,
        firmenname: input.firmenname,
        branche: input.branche,
        mitarbeiter: input.mitarbeiter,
        standort: input.standort,
        logoPath: input.logoPath,
      },
    });
    revalidatePath('/');
    revalidatePath('/wizard/1');
    return { success: true };
  } catch (error) {
    console.error('saveCompanyProfile error:', error);
    return { success: false, error: 'Firmenprofil konnte nicht gespeichert werden.' };
  }
}

// ─── Reporting Year ───────────────────────────────────────────────────────────

/**
 * Returns the ReportingYear for the given calendar year, creating it if
 * it does not yet exist. This ensures years are only created on demand.
 */
export async function getOrCreateYear(year: number): Promise<{ id: number; year: number } | null> {
  try {
    return await prisma.reportingYear.upsert({
      where: { year },
      update: {},
      create: { year },
    });
  } catch (error) {
    console.error('getOrCreateYear error:', error);
    return null;
  }
}

// ─── Emission Entries ─────────────────────────────────────────────────────────

export interface SaveEntryInput {
  yearId: number;
  scope: Scope;
  category: EmissionCategory;
  quantity: number;
  memo?: string;
  isOekostrom?: boolean;
  inputMethod?: InputMethod;
}

/**
 * Upserts a single emission entry.
 * The unique constraint is (reportingYearId, scope, category) — one entry per
 * category per year. Subsequent saves update quantity and memo in place.
 */
export async function saveEntry(input: SaveEntryInput): Promise<ActionResult> {
  try {
    await prisma.emissionEntry.upsert({
      where: {
        reportingYearId_scope_category: {
          reportingYearId: input.yearId,
          scope: input.scope,
          category: input.category,
        },
      },
      update: {
        quantity: input.quantity,
        memo: input.memo,
        isOekostrom: input.isOekostrom ?? false,
        inputMethod: input.inputMethod ?? 'MANUAL',
      },
      create: {
        reportingYearId: input.yearId,
        scope: input.scope,
        category: input.category,
        quantity: input.quantity,
        memo: input.memo,
        isOekostrom: input.isOekostrom ?? false,
        inputMethod: input.inputMethod ?? 'MANUAL',
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('saveEntry error:', error);
    return { success: false, error: 'Eintrag konnte nicht gespeichert werden.' };
  }
}

/**
 * Deletes a single emission entry for a category.
 */
export async function deleteEntry(
  yearId: number,
  scope: Scope,
  category: EmissionCategory
): Promise<ActionResult> {
  try {
    await prisma.emissionEntry.deleteMany({
      where: { reportingYearId: yearId, scope, category },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('deleteEntry error:', error);
    return { success: false, error: 'Eintrag konnte nicht gelöscht werden.' };
  }
}

// ─── Material Entries ─────────────────────────────────────────────────────────

export interface MaterialEntryInput {
  material: MaterialCategory;
  quantityKg: number;
  supplierName?: string;
}

/**
 * Replaces all material entries for a reporting year.
 * Uses a delete-then-insert approach because the material table has no
 * unique constraint on (yearId, material) — users can have multiple rows
 * of the same material from different suppliers.
 */
export async function saveMaterialEntries(input: {
  yearId: number;
  entries: MaterialEntryInput[];
}): Promise<ActionResult> {
  try {
    await prisma.$transaction([
      prisma.materialEntry.deleteMany({ where: { reportingYearId: input.yearId } }),
      prisma.materialEntry.createMany({
        data: input.entries.map((e) => ({
          reportingYearId: input.yearId,
          material: e.material,
          quantityKg: e.quantityKg,
          supplierName: e.supplierName,
        })),
      }),
    ]);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('saveMaterialEntries error:', error);
    return { success: false, error: 'Materialien konnten nicht gespeichert werden.' };
  }
}
