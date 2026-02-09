import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = new PrismaClient();
  }
  return globalForPrisma._prisma;
}

// Use a getter so PrismaClient is only instantiated on first actual use,
// not at module import time (which happens during Next.js build).
const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export { prisma };
export default prisma;
