export default function TokensLoading() {
  return (
    <div className="space-y-5 py-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="material-stat animate-pulse p-5">
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="material-card animate-pulse p-5">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-3 rounded-full bg-blue-100/70" />
        <div className="mt-3 h-4 w-48 rounded bg-slate-100" />
      </div>
      <div className="material-card animate-pulse p-5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
