/**
 * Prisma client singleton.
 *
 * Reused across server invocations in the same process.
 * The `globalForPrisma` guard prevents creating too many database
 * connections during Next.js hot-module reloads in development.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
