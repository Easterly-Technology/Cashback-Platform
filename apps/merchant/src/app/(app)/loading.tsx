export default function MerchantAppLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <div className="material-card p-6">
          <div className="h-5 w-32 animate-pulse rounded-full bg-emerald-100" />
          <div className="mt-5 h-9 w-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-100" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="material-stat p-5 sm:last:col-span-2"
            >
              <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-4 h-8 w-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="material-table-shell hidden min-h-72 animate-pulse lg:block" />
      <div className="material-empty px-6 py-12 text-center text-sm text-slate-400 lg:hidden">
        Loading merchant workspace...
      </div>
    </div>
  );
}
