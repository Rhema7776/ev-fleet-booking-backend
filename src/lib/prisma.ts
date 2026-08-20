import { PrismaClient } from "@prisma/client";

// Prevents exhausting DB connections when tsx/nodemon hot-reloads in dev —
// without this guard, every reload creates a brand new PrismaClient.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
