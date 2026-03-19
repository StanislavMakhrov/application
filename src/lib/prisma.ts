/**
 * Prisma client singleton for GrünBilanz.
 * Re-uses a single PrismaClient instance in development to avoid exhausting
 * the connection pool during hot-reloads (Next.js dev server restarts).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Persist the client across hot-reloads in development only
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
