/**
 * Company service — data access layer for the Company model.
 *
 * All database access goes through Prisma for type safety.
 * Every operation is scoped to the authenticated user's ID (userId) to
 * enforce tenant isolation: one user cannot access another's company data.
 */
import { prisma } from '@/lib/prisma';
import type { Branche } from '@/lib/benchmarks';

export interface CompanyInput {
  name: string;
  branche: Branche;
  mitarbeiter: number;
  standort: string;
}

/**
 * Create or update the company record for the given user.
 * Uses upsert so that re-submitting the onboarding form updates existing data.
 *
 * @param userId  Supabase auth.users.id of the currently authenticated user
 * @param data    Company fields from the onboarding form
 */
export async function upsertCompany(userId: string, data: CompanyInput) {
  return prisma.company.upsert({
    where: { userId },
    create: {
      userId,
      name: data.name,
      branche: data.branche,
      mitarbeiter: data.mitarbeiter,
      standort: data.standort,
    },
    update: {
      name: data.name,
      branche: data.branche,
      mitarbeiter: data.mitarbeiter,
      standort: data.standort,
    },
  });
}

/**
 * Retrieve the company record for the authenticated user.
 * Returns null if the user has not completed onboarding yet.
 *
 * @param userId  Supabase auth.users.id
 */
export async function getCompanyByUserId(userId: string) {
  return prisma.company.findUnique({ where: { userId } });
}
