import { SubPageHeader } from "../sub-page-header";

export default function DocumentsPage() {
  return (
    <div className="space-y-4">
      <SubPageHeader title="Documents" />

      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">
          Your Documents
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Upload and manage your identity documents and files.
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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M12 18v-6" />
            <path d="m9 15 3-3 3 3" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">
          No documents uploaded
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Document management is coming soon.
        </p>
      </div>
    </div>
  );
}
