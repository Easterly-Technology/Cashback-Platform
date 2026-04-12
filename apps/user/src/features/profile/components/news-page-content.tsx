import { prisma } from "@cashback/database";
import { SubPageHeader } from "@/features/profile/components/sub-page-header";

export async function NewsPageContent() {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      status: "PUBLISHED",
      audience: {
        in: ["ALL_USERS", "ACTIVE_USERS"],
      },
      publishedAt: {
        lte: now,
      },
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  return (
    <div className="space-y-4">
      <SubPageHeader title="Our News" />

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Announcements & Updates
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Stay up to date with the latest news from the platform.
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="material-empty flex flex-col items-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-6 w-6 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
              <path d="M7 8h6" />
              <path d="M7 12h10" />
              <path d="M7 16h8" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            No announcements yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            News broadcasts from the admin center will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="material-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  Platform Update
                </span>
                {announcement.isPinned ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Pinned
                  </span>
                ) : null}
                <span className="text-xs text-slate-400">
                  {announcement.publishedAt?.toLocaleString() ??
                    announcement.createdAt.toLocaleString()}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-950">
                {announcement.title}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {announcement.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
