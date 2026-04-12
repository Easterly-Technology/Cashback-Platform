export default function ProfileLoading() {
  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <div className="material-card flex animate-pulse items-center gap-4 p-5">
        <div className="h-14 w-14 rounded-full bg-[#2b3139]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 rounded bg-[#2b3139]" />
          <div className="h-4 w-48 rounded bg-[#1e2329]" />
        </div>
      </div>
      <div className="material-card animate-pulse overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[#1e2329] px-5 py-4 last:border-0">
            <div className="h-10 w-10 rounded-lg bg-[#2b3139]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 rounded bg-[#2b3139]" />
              <div className="h-3 w-44 rounded bg-[#1e2329]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
