import { statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@/prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const GENERATED_CLIENT_MARKER = join(
  process.cwd(),
  "prisma/generated/prisma/internal/class.ts"
);

function generatedClientMtime(): number {
  try {
    return statSync(GENERATED_CLIENT_MARKER).mtimeMs;
  } catch {
    return 0;
  }
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

type PrismaGlobal = {
  prisma?: PrismaClient;
  prismaGeneratedMtime?: number;
};

const globalForPrisma = globalThis as unknown as PrismaGlobal;

function getPrismaClient(): PrismaClient {
  const mtime = generatedClientMtime();

  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaGeneratedMtime !== mtime
  ) {
    void globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaGeneratedMtime = mtime;
  }

  return globalForPrisma.prisma;
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? getPrismaClient()
    : new Proxy({} as PrismaClient, {
        get(_target, prop) {
          const client = getPrismaClient();
          const value = client[prop as keyof PrismaClient];
          return typeof value === "function" ? value.bind(client) : value;
        },
      });
