// src/lib/prisma.ts
// Mock Prisma client for deployment
// This is a temporary solution until Prisma is properly set up

// Define a mock PrismaClient type with required models
export class PrismaClient {
  work: {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args?: any) => Promise<any | null>;
    create: (args?: any) => Promise<any>;
    update: (args?: any) => Promise<any>;
    delete: (args?: any) => Promise<any>;
    // Add other methods as needed
  };

  constructor(options?: any) {
    // Initialize models
    this.work = {
      findMany: async () => [],
      findUnique: async () => null,
      create: async (args) => args.data,
      update: async (args) => args.data,
      delete: async () => ({}),
      // Implement other methods as needed
    };
  }

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

// Export both as default and named export to support different import styles
export { prisma };
export default prisma;