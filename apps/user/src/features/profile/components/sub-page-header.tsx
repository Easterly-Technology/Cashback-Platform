import Link from "next/link";

export function SubPageHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link
        href="/profile"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2b3139] text-[#eaecef] transition hover:bg-[#1e2329]"
        aria-label="Back to profile"
      >
        <svg
          className="h-5 w-5"
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
      <h1 className="text-lg font-bold text-white">{title}</h1>
    </div>
  );
}
