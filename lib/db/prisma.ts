import { PrismaClient } from "@prisma/client";

// Use a simple let/const pattern that's unambiguous at runtime
const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

let _prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  _prisma = globalForPrisma.__prisma ?? createPrismaClient();
  globalForPrisma.__prisma = _prisma;
} else {
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = createPrismaClient();
  }
  _prisma = globalForPrisma.__prisma;
}

export const prisma = _prisma;
export default prisma;