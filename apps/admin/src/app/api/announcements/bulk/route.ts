import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { announcementBulkUpdateSchema } from "@cashback/shared";
import { requireSuperAdmin } from "@/lib/admin-session";

export async function PATCH(request: Request) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = announcementBulkUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { id: { in: parsed.data.ids } },
      select: {
        id: true,
        title: true,
        status: true,
        isPinned: true,
        publishedAt: true,
      },
    });

    if (announcements.length === 0) {
      return Response.json(
        { error: "No announcements found" },
        { status: 404 },
      );
    }

    const now = new Date();

    await prisma.$transaction(
      announcements.map((announcement) =>
        prisma.announcement.update({
          where: { id: announcement.id },
          data:
            parsed.data.action === "publish"
              ? {
                  status: "PUBLISHED",
                  publishedAt:
                    announcement.publishedAt && announcement.publishedAt > now
                      ? announcement.publishedAt
                      : now,
                }
              : parsed.data.action === "archive"
                ? {
                    status: "ARCHIVED",
                    isPinned: false,
                  }
                : parsed.data.action === "restore"
                  ? {
                      status: "DRAFT",
                    }
                  : parsed.data.action === "pin"
                    ? {
                        isPinned: true,
                      }
                    : {
                        isPinned: false,
                      },
        }),
      ),
    );

    await Promise.all(
      announcements.map((announcement) =>
        writeAuditLog(prisma, {
          actorType: "ADMIN",
          actorId: session.admin.id,
          action: "BULK_UPDATE_ANNOUNCEMENT",
          resourceType: "ANNOUNCEMENT",
          resourceId: announcement.id,
          details: {
            action: parsed.data.action,
            title: announcement.title,
            previousStatus: announcement.status,
            previousPinned: announcement.isPinned,
          },
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        }),
      ),
    );

    return Response.json({
      success: true,
      updatedCount: announcements.length,
    });
  } catch (error) {
    console.error("[ADMIN] Failed to bulk update announcements:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
