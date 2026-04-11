import { prisma } from "@cashback/database";
import AnnouncementManager from "./announcement-manager";
import { getAdminSessionUser, isSuperAdmin } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const [currentAdmin, announcements] = await Promise.all([
    getAdminSessionUser(),
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const serializedAnnouncements = announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    status: announcement.status,
    audience: announcement.audience,
    isPinned: announcement.isPinned,
    publishedAt: announcement.publishedAt?.toISOString() ?? null,
    createdAt: announcement.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Broadcast Center</span>
        <h1 className="material-title mt-4 text-slate-950">Announcements</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Publish, schedule, pin, and manage platform updates without leaving the admin dashboard.
        </p>
      </div>

      <AnnouncementManager
        initialAnnouncements={serializedAnnouncements}
        canManage={isSuperAdmin(currentAdmin?.role)}
      />
    </div>
  );
}
