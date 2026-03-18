import { PrismaClient } from '@prisma/client';
import { getPrismaDatasourceUrl } from '@/lib/prisma-runtime';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const datasourceUrl = getPrismaDatasourceUrl(process.env);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
