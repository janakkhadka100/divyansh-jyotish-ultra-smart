import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with error handling
let prisma: PrismaClient;

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  });
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Create a mock prisma client for demo purposes
  prisma = {
    user: {
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    astrologicalData: {
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    chatMessage: {
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    session: {
      create: () => Promise.resolve({}),
      findUnique: () => Promise.resolve(null),
    },
    $disconnect: () => Promise.resolve(),
  } as any;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
