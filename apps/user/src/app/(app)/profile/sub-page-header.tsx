import Link from "next/link";

export function SubPageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100"
      >
        <svg
          className="h-5 w-5 text-slate-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-lg font-bold text-slate-950">{title}</h1>
    </div>
  );
}
