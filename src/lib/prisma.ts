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

// Create a singleton instance
declare global {
  // prevent creating multiple instances in dev
  var prisma: PrismaClient | undefined;
}

// Create the mock prisma instance using singleton pattern
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the mock instance
export default prisma;