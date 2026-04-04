import { prisma } from "@cashback/database";
import {
  adminTokenSettingsSchema,
  getTokenSettingsSnapshot,
} from "@cashback/shared";

const TOKEN_SETTING_KEYS = [
  "token_multiplier",
  "token_release_rate",
  "marketplace_enabled",
] as const;

export async function GET() {
  const settings = await prisma.platformSetting.findMany({
    where: { key: { in: [...TOKEN_SETTING_KEYS] } },
  });

  return Response.json(getTokenSettingsSnapshot(settings));
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = adminTokenSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid token settings", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { multiplier, releaseRate, marketplaceEnabled } = parsed.data;

  const updates = [
    {
      key: "token_multiplier",
      value: multiplier,
    },
    {
      key: "token_release_rate",
      value: releaseRate / 100,
    },
    {
      key: "marketplace_enabled",
      value: marketplaceEnabled,
    },
  ];

  const results = await Promise.all(
    updates.map((u) =>
      prisma.platformSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      }),
    ),
  );

  return Response.json({
    success: true,
    settings: getTokenSettingsSnapshot(results),
  });
}
