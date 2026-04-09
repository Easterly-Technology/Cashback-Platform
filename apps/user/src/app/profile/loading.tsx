export default function ProfileLoading() {
  return (
    <div className="space-y-4 py-4">
      <div className="material-card flex animate-pulse items-center gap-4 p-5">
        <div className="h-14 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-4 w-48 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="material-card animate-pulse px-4 py-3 text-center">
            <div className="mx-auto h-3 w-12 rounded bg-slate-200" />
            <div className="mx-auto mt-2 h-4 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="material-card animate-pulse overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100/70 px-5 py-4 last:border-0">
            <div className="h-10 w-10 rounded-2xl bg-slate-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-3 w-44 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
