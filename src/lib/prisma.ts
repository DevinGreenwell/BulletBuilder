// src/lib/prisma.ts
// Mock Prisma client for deployment
// This is a temporary solution until Prisma is properly set up

// Define a mock PrismaClient type to satisfy TypeScript
export class PrismaClient {
  constructor(options?: any) {}
  // Add any methods your app is using
  connect(): Promise<void> {
    return Promise.resolve();
  }
  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

// Create the mock prisma instance
const prisma = new PrismaClient();

// Export the mock instance
export { prisma };
export default prisma;import { PrismaClient } from '@prisma/client';
declare global {
  // prevent creating multiple instances in dev
  var prisma: PrismaClient | undefined;
}
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}