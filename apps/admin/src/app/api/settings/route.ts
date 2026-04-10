import { Prisma, prisma } from "@cashback/database";
import { writeAuditLog } from "@cashback/database/src/audit";
import { adminPlatformSettingsSchema } from "@cashback/shared";
import {
  getAdminPlatformSettingsSnapshot,
  toPlatformSettingUpdates,
} from "@/lib/platform-settings";
import {
  requireAdminSession,
  requireSuperAdmin,
} from "@/lib/admin-session";

function parseSingleSettingUpdate(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.key !== "string" ||
    record.key.trim().length === 0 ||
    record.key.length > 100 ||
    !("value" in record)
  ) {
    return null;
  }

  return {
    key: record.key.trim(),
    value: record.value,
  };
}

export async function GET() {
  const session = await requireAdminSession();

  if (!session.ok) {
    return session.response;
  }

  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
  });

  return Response.json(settings);
}

export async function PUT(request: Request) {
  const session = await requireSuperAdmin();

  if (!session.ok) {
    return session.response;
  }

  try {
    const body = await request.json();
    const singleSetting = parseSingleSettingUpdate(body);

    if (singleSetting) {
      const setting = await prisma.platformSetting.update({
        where: { key: singleSetting.key },
        data: {
          value: singleSetting.value as Prisma.InputJsonValue,
          updatedBy: session.admin.id,
        },
      });

      await writeAuditLog(prisma, {
        actorType: "ADMIN",
        actorId: session.admin.id,
        action: "UPDATE_PLATFORM_SETTING",
        resourceType: "PLATFORM_SETTING",
        details: {
          key: setting.key,
          value: setting.value,
        },
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      });

      return Response.json(setting);
    }

    const parsed = adminPlatformSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const normalizedInput = getAdminPlatformSettingsSnapshot(
      toPlatformSettingUpdates(parsed.data),
    );
    const updates = toPlatformSettingUpdates(normalizedInput);

    const results = await Promise.all(
      updates.map((setting) =>
        prisma.platformSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            description: setting.description,
            updatedBy: session.admin.id,
          },
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updatedBy: session.admin.id,
          },
        }),
      ),
    );

    await writeAuditLog(prisma, {
      actorType: "ADMIN",
      actorId: session.admin.id,
      action: "UPDATE_PLATFORM_SETTINGS",
      resourceType: "PLATFORM_SETTING",
      details: {
        keys: updates.map((setting) => setting.key),
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      success: true,
      settings: getAdminPlatformSettingsSnapshot(results),
    });
  } catch (error) {
    console.error("[ADMIN] Failed to update settings:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
