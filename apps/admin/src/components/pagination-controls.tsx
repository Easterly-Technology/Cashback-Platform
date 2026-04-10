import Link from "next/link";

function buildHref(
  pathname: string,
  params: Record<string, string | undefined>,
  page: number,
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  if (page > 1) {
    search.set("page", String(page));
  } else {
    search.delete("page");
  }

  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function PaginationControls({
  pathname,
  params,
  page,
  pageSize,
  totalCount,
}: {
  pathname: string;
  params: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  totalCount: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages} · {totalCount.toLocaleString()} total records
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(pathname, params, Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-full px-3 py-2 text-sm font-medium ${
            page <= 1
              ? "pointer-events-none bg-slate-100 text-slate-400"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          Previous
        </Link>
        <Link
          href={buildHref(pathname, params, Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-full px-3 py-2 text-sm font-medium ${
            page >= totalPages
              ? "pointer-events-none bg-slate-100 text-slate-400"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
