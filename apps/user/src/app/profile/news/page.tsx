import { SubPageHeader } from "../sub-page-header";

export default function NewsPage() {
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
    </div>
  );
}
