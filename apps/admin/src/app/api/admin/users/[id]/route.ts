import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminUserStatusUpdateSchema } from "@cashback/shared";
import { requireSuperAdmin } from "@/lib/admin-session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = adminUserStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (existing.status === parsed.data.status) {
      return Response.json(
        { error: "User already has this status" },
        { status: 409 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status: parsed.data.status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_USER_STATUS",
      resourceType: "USER",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        email: existing.email,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, user: updated });
  } catch (error) {
    console.error("[ADMIN] Failed to update user status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
