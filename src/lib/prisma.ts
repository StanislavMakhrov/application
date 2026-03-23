/**
 * Prisma client singleton for GrünBilanz.
 *
 * Next.js hot-reloading creates a new module context on each reload,
 * which would create multiple Prisma client instances and exhaust the
 * database connection pool. We store the instance on `globalThis` in
 * development to prevent this.
 *
 * Reference: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
