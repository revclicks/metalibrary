import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { _pc: any };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma._pc ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma._pc = prisma;

export { prisma };
export default prisma;
