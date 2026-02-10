let _prisma: any = null;

function getPrisma() {
  if (!_prisma) {
    const { PrismaClient } = require("@prisma/client");
    _prisma = new PrismaClient();
  }
  return _prisma;
}

const prisma = new Proxy({} as any, {
  get(_target, prop) {
    return getPrisma()[prop];
  },
});

export { prisma };
export default prisma;
