import { existsSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function ensureWorkspaceEnv() {
  if (process.env.DATABASE_URL) return;
  if (process.env.NEXT_RUNTIME === "edge") return;
  if (typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== "undefined") {
    return;
  }

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, `.env.${nodeEnv}.local`),
    path.join(cwd, ".env.local"),
    path.join(cwd, `.env.${nodeEnv}`),
    path.join(cwd, ".env"),
    path.resolve(cwd, "..", "..", `.env.${nodeEnv}.local`),
    path.resolve(cwd, "..", "..", ".env.local"),
    path.resolve(cwd, "..", "..", `.env.${nodeEnv}`),
    path.resolve(cwd, "..", "..", ".env"),
  ];

  for (const candidate of candidates) loadEnvFile(candidate);
}

ensureWorkspaceEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.LOG_LEVEL === "debug"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export type { PrismaClient } from "@prisma/client";
