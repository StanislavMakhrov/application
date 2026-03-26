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
import type { Prisma } from '@prisma/client';
import type { Scope, EmissionCategory, MaterialCategory, Branche, InputMethod } from '@/types';

// AuditAction mirrors the Prisma schema enum. Defined locally because the
// generated @prisma/client may not export it in all environments (Prisma v7).
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

type ActionResult = { success: boolean; error?: string };

// ─── Company Profile ─────────────────────────────────────────────────────────

export interface SaveCompanyProfileInput {
  firmenname: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
  logoPath?: string;
  reportingBoundaryNotes?: string;
  exclusions?: string;
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
        reportingBoundaryNotes: input.reportingBoundaryNotes ?? null,
        exclusions: input.exclusions ?? null,
      },
      create: {
        id: 1,
        firmenname: input.firmenname,
        branche: input.branche,
        mitarbeiter: input.mitarbeiter,
        standort: input.standort,
        logoPath: input.logoPath,
        reportingBoundaryNotes: input.reportingBoundaryNotes ?? null,
        exclusions: input.exclusions ?? null,
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

/**
 * Creates a new ReportingYear for the given calendar year.
 * Used by the dashboard "Add year" button and the Settings page.
 * Returns the year value on success so the caller can redirect to it.
 */
export async function createYear(year: number): Promise<ActionResult & { year?: number }> {
  try {
    await prisma.reportingYear.upsert({
      where: { year },
      update: {},
      create: { year },
    });
    revalidatePath('/');
    revalidatePath('/settings');
    return { success: true, year };
  } catch (error) {
    console.error('createYear error:', error);
    return { success: false, error: 'Berichtsjahr konnte nicht erstellt werden.' };
  }
}

/**
 * Deletes a ReportingYear and all associated data (entries, material entries,
 * staging entries, reports) via the cascade defined in the schema.
 * Returns the deleted year's value so the caller can redirect away from it.
 */
export async function deleteYear(year: number): Promise<ActionResult> {
  try {
    const record = await prisma.reportingYear.findUnique({ where: { year } });
    if (!record) {
      return { success: false, error: 'Berichtsjahr nicht gefunden.' };
    }
    await prisma.reportingYear.delete({ where: { year } });
    revalidatePath('/');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('deleteYear error:', error);
    return { success: false, error: 'Berichtsjahr konnte nicht gelöscht werden.' };
  }
}

// ─── Audit Logging ────────────────────────────────────────────────────────────

interface AuditEventInput {
  entityType: string;
  entityId?: number;
  action: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  inputMethod?: InputMethod;
  documentId?: number;
  metadata?: Record<string, unknown>;
  emissionEntryId?: number;
  materialEntryId?: number;
}

/**
 * Writes a single audit log entry.
 *
 * Called after every CREATE/UPDATE/DELETE of emission or material data.
 * Errors are intentionally swallowed — audit failures must never block
 * the primary data-save path.
 */
async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        fieldName: input.fieldName,
        oldValue: input.oldValue,
        newValue: input.newValue,
        inputMethod: input.inputMethod ?? 'MANUAL',
        documentId: input.documentId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
        emissionEntryId: input.emissionEntryId,
        materialEntryId: input.materialEntryId,
      },
    });
  } catch (error) {
    // Audit logging must never block data saves — log and continue
    console.error('logAuditEvent error (non-fatal):', error);
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
  // Monthly billing: 1–12 to store a single month, omit for annual
  billingMonth?: number;
  // Set to true when an annual total supersedes any monthly entries
  isFinalAnnual?: boolean;
  // Provider name for mid-year provider-change tracking
  providerName?: string;
  // ID of the source document (returned by OCR/CSV upload endpoints)
  documentId?: number;
}

/**
 * Upserts a single emission entry and records the change in the audit log.
 *
 * The unique constraint is (reportingYearId, scope, category, billingMonth,
 * providerName) — null billingMonth means an annual entry. Because Prisma's
 * compound-unique where clause does not support null, we implement the
 * upsert manually using findFirst + create/update.
 */
export async function saveEntry(input: SaveEntryInput): Promise<ActionResult> {
  try {
    const newMethod = input.inputMethod ?? 'MANUAL';

    // Look up any existing entry to compute old/new delta for the audit log.
    // Using findFirst because Prisma's compound-unique where does not accept null.
    const existing = await prisma.emissionEntry.findFirst({
      where: {
        reportingYearId: input.yearId,
        scope: input.scope,
        category: input.category,
        billingMonth: input.billingMonth ?? null,
        providerName: input.providerName ?? null,
      },
    });

    let entryId: number;

    if (existing) {
      await prisma.emissionEntry.update({
        where: { id: existing.id },
        data: {
          quantity: input.quantity,
          memo: input.memo,
          isOekostrom: input.isOekostrom ?? false,
          inputMethod: newMethod,
          isFinalAnnual: input.isFinalAnnual ?? false,
          providerName: input.providerName ?? null,
        },
      });
      entryId = existing.id;
    } else {
      const created = await prisma.emissionEntry.create({
        data: {
          reportingYearId: input.yearId,
          scope: input.scope,
          category: input.category,
          quantity: input.quantity,
          memo: input.memo,
          isOekostrom: input.isOekostrom ?? false,
          inputMethod: newMethod,
          billingMonth: input.billingMonth ?? null,
          isFinalAnnual: input.isFinalAnnual ?? false,
          providerName: input.providerName ?? null,
        },
      });
      entryId = created.id;
    }

    // Record the change — quantity delta is the most useful audit field
    await logAuditEvent({
      entityType: 'EmissionEntry',
      entityId: entryId,
      action: existing ? 'UPDATE' : 'CREATE',
      fieldName: 'quantity',
      oldValue: existing ? String(existing.quantity) : undefined,
      newValue: String(input.quantity),
      inputMethod: newMethod,
      documentId: input.documentId,
      emissionEntryId: entryId,
      metadata: {
        category: input.category,
        scope: input.scope,
        billingMonth: input.billingMonth ?? null,
        providerName: input.providerName ?? null,
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
    // Fetch IDs before deletion so we can reference them in the audit log
    const toDelete = await prisma.emissionEntry.findMany({
      where: { reportingYearId: yearId, scope, category },
      select: { id: true, quantity: true },
    });

    await prisma.emissionEntry.deleteMany({
      where: { reportingYearId: yearId, scope, category },
    });

    // Log one DELETE event per removed row
    for (const row of toDelete) {
      await logAuditEvent({
        entityType: 'EmissionEntry',
        entityId: row.id,
        action: 'DELETE',
        fieldName: 'quantity',
        oldValue: String(row.quantity),
        metadata: { category, scope },
      });
    }

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
 * Replaces all material entries for a reporting year and logs the delta.
 *
 * Uses a delete-then-insert approach because the material table has no
 * unique constraint on (yearId, material) — users can have multiple rows
 * of the same material from different suppliers.
 *
 * The snapshot of existing rows is taken inside an interactive transaction
 * so the audit log accurately reflects what was deleted in that specific tx.
 */
export async function saveMaterialEntries(input: {
  yearId: number;
  entries: MaterialEntryInput[];
}): Promise<ActionResult> {
  try {
    // Use an interactive transaction so the pre-deletion snapshot, the
    // delete, and the create all occur atomically — no race conditions.
    const { deleted, created } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Snapshot existing rows before deletion (within the same transaction)
      const existingRows = await tx.materialEntry.findMany({
        where: { reportingYearId: input.yearId },
        select: { id: true, material: true, quantityKg: true },
      });

      await tx.materialEntry.deleteMany({ where: { reportingYearId: input.yearId } });

      await tx.materialEntry.createMany({
        data: input.entries.map((e) => ({
          reportingYearId: input.yearId,
          material: e.material,
          quantityKg: e.quantityKg,
          supplierName: e.supplierName,
        })),
      });

      // Read back created rows to get their assigned IDs
      const created = await tx.materialEntry.findMany({
        where: { reportingYearId: input.yearId },
        select: { id: true, material: true, quantityKg: true },
      });

      return { deleted: existingRows, created };
    });

    // Audit DELETE events for every row that was removed
    for (const row of deleted) {
      await logAuditEvent({
        entityType: 'MaterialEntry',
        entityId: row.id,
        action: 'DELETE',
        fieldName: 'quantityKg',
        oldValue: String(row.quantityKg),
        metadata: { material: row.material },
      });
    }

    // Audit CREATE events for every new row
    for (const row of created) {
      await logAuditEvent({
        entityType: 'MaterialEntry',
        entityId: row.id,
        action: 'CREATE',
        fieldName: 'quantityKg',
        newValue: String(row.quantityKg),
        materialEntryId: row.id,
        metadata: { material: row.material },
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('saveMaterialEntries error:', error);
    return { success: false, error: 'Materialien konnten nicht gespeichert werden.' };
  }
}
