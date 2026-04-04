import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, Prisma } from "@prisma/client";

export interface AuditContext {
  actorType: "USER" | "MERCHANT" | "ADMIN" | "SYSTEM";
  actorId: string;
  ipAddress?: string;
}

export const auditStorage = new AsyncLocalStorage<AuditContext>();

export function withAuditContext<T>(
  ctx: AuditContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return auditStorage.run(ctx, fn);
}

/**
 * Create an audit log entry directly.
 * Use this in API routes after write operations.
 */
export async function writeAuditLog(
  prisma: PrismaClient,
  entry: {
    actorType: "USER" | "MERCHANT" | "ADMIN" | "SYSTEM";
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  },
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? null,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("[AUDIT] Failed to write audit log:", e);
  }
}
