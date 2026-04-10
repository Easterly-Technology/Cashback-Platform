import { prisma } from "@cashback/database";
import { csvResponse, toCsv } from "@/lib/csv";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET(request: Request) {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const params = new URL(request.url).searchParams;
  const where: Record<string, unknown> = {};
  const actorType = params.get("actorType");
  const action = params.get("action");
  const resourceType = params.get("resourceType");
  const query = params.get("query");

  if (actorType && actorType !== "all") {
    where.actorType = actorType;
  }
  if (action) {
    where.action = { contains: action };
  }
  if (resourceType && resourceType !== "all") {
    where.resourceType = resourceType;
  }
  if (query) {
    where.OR = [
      { actorId: { contains: query } },
      { resourceId: { contains: query } },
      { action: { contains: query } },
      { resourceType: { contains: query } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return csvResponse(
    "audit-log.csv",
    toCsv(
      [
        "id",
        "actor_type",
        "actor_id",
        "action",
        "resource_type",
        "resource_id",
        "details",
        "ip_address",
        "created_at",
      ],
      logs.map((log) => [
        log.id.toString(),
        log.actorType,
        log.actorId,
        log.action,
        log.resourceType,
        log.resourceId ?? "",
        log.details ? JSON.stringify(log.details) : "",
        log.ipAddress ?? "",
        log.createdAt.toISOString(),
      ]),
    ),
  );
}
