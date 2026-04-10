import { prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { announcementCreateSchema } from "@cashback/shared";
import {
  requireAdminSession,
  requireSuperAdmin,
} from "@/lib/admin-session";

function resolvePublishAt(
  publishNow: boolean,
  publishAt?: string | null,
) {
  if (publishNow) {
    return new Date();
  }

  if (!publishAt) {
    return null;
  }

  const parsed = new Date(publishAt);
  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }

  return parsed;
}

export async function GET() {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return Response.json(announcements);
}

export async function POST(request: Request) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const parsed = announcementCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const publishAt = resolvePublishAt(
      parsed.data.publishNow,
      parsed.data.publishAt,
    );

    if (publishAt === "invalid") {
      return Response.json(
        { error: "Invalid scheduled publish date" },
        { status: 400 },
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        status: parsed.data.publishNow || publishAt ? "PUBLISHED" : "DRAFT",
        audience: parsed.data.audience,
        isPinned: parsed.data.isPinned,
        createdBy: session.admin.id,
        publishedAt: publishAt,
      },
    });

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action:
        announcement.status === "PUBLISHED"
          ? "CREATE_AND_SCHEDULE_ANNOUNCEMENT"
          : "CREATE_ANNOUNCEMENT",
      resourceType: "ANNOUNCEMENT",
      resourceId: announcement.id,
      details: {
        status: announcement.status,
        audience: announcement.audience,
        isPinned: announcement.isPinned,
        publishAt: announcement.publishedAt?.toISOString() ?? null,
        title: announcement.title,
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({ success: true, announcement });
  } catch (error) {
    console.error("[ADMIN] Failed to create announcement:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
