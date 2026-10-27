import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel the deployed filesystem is read-only, so the seeded demo database
// (built into prisma/seed.db at build time) is copied to /tmp on first use.
// Locally nothing changes: DATABASE_URL from .env is used as before.
function resolveDatasourceUrl(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  const target = "/tmp/bharatfleet.db";
  if (!fs.existsSync(target)) {
    const source = path.join(process.cwd(), "prisma", "seed.db");
    fs.copyFileSync(source, target);
  }
  const url = `file:${target}`;
  process.env.DATABASE_URL = url;
  return url;
}

// Reuse the Prisma client across hot reloads in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = resolveDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
