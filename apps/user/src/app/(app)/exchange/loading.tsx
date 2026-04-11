export default function ExchangeLoading() {
  return (
    <div className="space-y-4 py-4">
      <div className="material-card animate-pulse overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="border-b-[3px] border-blue-600 py-3 text-center">
            <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
          </div>
          <div className="border-b-[3px] border-transparent py-3 text-center">
            <div className="mx-auto h-4 w-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="material-card-flat animate-pulse flex items-center gap-4 px-5 py-4">
        <div className="h-5 w-20 rounded bg-slate-200" />
        <div className="h-6 w-24 rounded bg-slate-200" />
      </div>
      <div className="material-card animate-pulse overflow-hidden px-5 py-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="grid grid-cols-3 border-b border-slate-100/70 py-2.5 last:border-0">
            <div className="h-4 w-10 rounded bg-slate-200" />
            <div className="mx-auto h-4 w-8 rounded bg-slate-100" />
            <div className="ml-auto h-4 w-12 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
