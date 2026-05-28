import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientInstance = {
  [key: string]: any;
  $disconnect: () => Promise<void>;
};

type PrismaClientConstructor = new (options: {
  adapter: PrismaPg;
}) => PrismaClientInstance;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance;
};

let prismaClient: PrismaClientInstance | undefined;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  const adapter = new PrismaPg(connectionString);
  const { PrismaClient } = require("@prisma/client") as {
    PrismaClient: PrismaClientConstructor;
  };
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  prismaClient = globalForPrisma.prisma ?? prismaClient ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClientInstance, {
  get(_target, property) {
    return getPrismaClient()[property as string];
  },
});
