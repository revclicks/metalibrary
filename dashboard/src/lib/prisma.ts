let _prisma: any = null;

export function getPrisma() {
  if (!_prisma) {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

const prisma: any = new Proxy(
  {},
  {
    get(_target, prop) {
      return getPrisma()[prop];
    },
  }
);

export { prisma };
export default prisma;
