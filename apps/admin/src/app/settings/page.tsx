import { prisma } from "@cashback/database";
import { getAdminSessionUser, isSuperAdmin } from "@/lib/admin-session";
import { getAdminPlatformSettingsSnapshot } from "@/lib/platform-settings";
import SettingsManager from "./settings-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [currentAdmin, settings, recentLogs, admins] = await Promise.all([
    getAdminSessionUser(),
    prisma.platformSetting.findMany({
      orderBy: { key: "asc" },
    }),
    prisma.auditLog.findMany({
      where: {
        resourceType: "PLATFORM_SETTING",
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    }),
  ]);

  const adminMap = new Map(
    admins.map((admin) => [admin.id, `${admin.email} · ${admin.role}`]),
  );

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Platform Settings</span>
        <h1 className="material-title mt-4 text-slate-950">Settings</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Grouped controls with validation and audit visibility for finance defaults, token policy, and exchange configuration.
        </p>
      </div>

      <SettingsManager
        initialSettings={getAdminPlatformSettingsSnapshot(settings)}
        canEdit={isSuperAdmin(currentAdmin?.role)}
        recentChanges={recentLogs.map((entry) => ({
          id: String(entry.id),
          action: entry.action,
          createdAt: entry.createdAt.toISOString(),
          actorLabel: adminMap.get(entry.actorId) ?? entry.actorId,
        }))}
      />
    </div>
  );
}
