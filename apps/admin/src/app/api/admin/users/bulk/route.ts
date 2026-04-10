import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminUserBulkStatusUpdateSchema } from "@cashback/shared";
import { requireSuperAdmin } from "@/lib/admin-session";

export async function PATCH(request: Request) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = adminUserBulkStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existingUsers = await prisma.user.findMany({
      where: { id: { in: parsed.data.ids } },
      select: { id: true, email: true, status: true },
    });

    if (existingUsers.length === 0) {
      return Response.json({ error: "No users found" }, { status: 404 });
    }

    const targetUsers = existingUsers.filter(
      (user) => user.status !== parsed.data.status,
    );

    if (targetUsers.length === 0) {
      return Response.json(
        { error: "Selected users already have this status" },
        { status: 409 },
      );
    }

    await prisma.user.updateMany({
      where: { id: { in: targetUsers.map((user) => user.id) } },
      data: { status: parsed.data.status },
    });

    await Promise.all(
      targetUsers.map((user) =>
        writeAuditLog(prisma, {
          actorType: "ADMIN",
          actorId: session.admin.id,
          action: "BULK_UPDATE_USER_STATUS",
          resourceType: "USER",
          resourceId: user.id,
          details: {
            previousStatus: user.status,
            nextStatus: parsed.data.status,
            email: user.email,
          },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        }),
      ),
    );

    return Response.json({
      success: true,
      updatedCount: targetUsers.length,
    });
  } catch (error) {
    console.error("[ADMIN] Failed to bulk update users:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
