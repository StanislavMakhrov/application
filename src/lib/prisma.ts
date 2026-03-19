/**
 * Prisma client singleton for GrünBilanz.
 * Reuses a single PrismaClient instance across hot-reloads in development
 * to prevent exhausting the database connection pool.
 */

import { PrismaClient } from '@prisma/client';

// Extend the global type to cache the Prisma instance during dev hot-reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Cache in global scope during development to survive hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
