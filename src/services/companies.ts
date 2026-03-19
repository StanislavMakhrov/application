/**
 * Company CRUD operations via Prisma.
 * All operations are scoped to the authenticated user (via userId).
 * Maps Prisma's camelCase fields back to the snake_case Company domain type.
 */

import { prisma } from '@/lib/prisma';
import type { Company, Branche } from '@/types';

export interface CreateCompanyInput {
  user_id: string;
  name: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
}

/**
 * Fetch the company profile for the given user.
 * Returns null if the user has not yet completed onboarding.
 */
export async function getCompanyByUserId(userId: string): Promise<Company | null> {
  const row = await prisma.company.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    branche: row.branche as Branche,
    mitarbeiter: row.mitarbeiter,
    standort: row.standort,
  };
}

/**
 * Create or update the company profile for the given user.
 * Uses userId as the upsert key so re-submitting onboarding updates in place.
 */
export async function upsertCompany(input: CreateCompanyInput): Promise<Company> {
  const row = await prisma.company.upsert({
    where: { userId: input.user_id },
    create: {
      userId: input.user_id,
      name: input.name,
      branche: input.branche,
      mitarbeiter: input.mitarbeiter,
      standort: input.standort,
    },
    update: {
      name: input.name,
      branche: input.branche,
      mitarbeiter: input.mitarbeiter,
      standort: input.standort,
    },
  });
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    branche: row.branche as Branche,
    mitarbeiter: row.mitarbeiter,
    standort: row.standort,
  };
}
