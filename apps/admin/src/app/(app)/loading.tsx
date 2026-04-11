export default function AdminAppLoading() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="material-stat p-5">
            <div className="h-4 w-24 animate-pulse rounded-full bg-indigo-100" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="material-card p-5">
        <div className="h-5 w-40 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
