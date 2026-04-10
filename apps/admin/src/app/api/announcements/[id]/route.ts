import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { announcementUpdateSchema } from "@cashback/shared";
import { requireSuperAdmin } from "@/lib/admin-session";

function resolvePublishAt(
  existingPublishedAt: Date | null,
  publishNow?: boolean,
  publishAt?: string | null,
  nextStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  if (nextStatus === "ARCHIVED") {
    return null;
  }

  if (publishNow) {
    return new Date();
  }

  if (publishAt === undefined) {
    if (nextStatus === "PUBLISHED" && !existingPublishedAt) {
      return new Date();
    }
    if (nextStatus === "DRAFT") {
      return null;
    }

    return existingPublishedAt;
  }

  if (publishAt === null || publishAt === "") {
    if (nextStatus === "PUBLISHED") {
      return new Date();
    }

    return null;
  }

  const parsed = new Date(publishAt);

  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }

  return parsed;
}

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
    const parsed = announcementUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    const nextStatus = parsed.data.status ?? existing.status;
    const nextPublishAt = resolvePublishAt(
      existing.publishedAt,
      parsed.data.publishNow,
      parsed.data.publishAt,
      nextStatus,
    );

    if (nextPublishAt === "invalid") {
      return Response.json(
        { error: "Invalid scheduled publish date" },
        { status: 400 },
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: parsed.data.title ?? existing.title,
        body: parsed.data.body ?? existing.body,
        status: nextStatus,
        audience: parsed.data.audience ?? existing.audience,
        isPinned:
          nextStatus === "ARCHIVED"
            ? false
            : parsed.data.isPinned ?? existing.isPinned,
        publishedAt: nextPublishAt,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_ANNOUNCEMENT",
      resourceType: "ANNOUNCEMENT",
      resourceId: updated.id,
      details: {
        previousStatus: existing.status,
        nextStatus: updated.status,
        previousAudience: existing.audience,
        nextAudience: updated.audience,
        previousPinned: existing.isPinned,
        nextPinned: updated.isPinned,
        previousPublishedAt: existing.publishedAt?.toISOString() ?? null,
        nextPublishedAt: updated.publishedAt?.toISOString() ?? null,
        title: updated.title,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, announcement: updated });
  } catch (error) {
    console.error("[ADMIN] Failed to update announcement:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
