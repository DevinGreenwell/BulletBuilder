import { PrismaClient } from '@prisma/client';
declare global {
  // prevent creating multiple instances in dev
  var prisma: PrismaClient | undefined;
}
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}