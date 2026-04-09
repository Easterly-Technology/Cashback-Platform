export function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* QR CTA */}
      <div className="material-card-flat flex items-center gap-4 px-5 py-4">
        <div className="h-11 w-11 rounded-[20px] bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="h-3 w-36 rounded bg-slate-100" />
        </div>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="material-card-flat p-4">
            <div className="h-11 w-11 rounded-[18px] bg-slate-200" />
            <div className="mt-3 h-4 w-16 rounded bg-slate-200" />
            <div className="mt-1 h-3 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
      {/* At-a-Glance */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="material-stat p-4">
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-14 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3 w-40 rounded bg-slate-100" />
        <div className="h-3 w-16 rounded bg-slate-200" />
      </div>
      <div className="material-card overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-slate-50 px-4 py-3 last:border-0"
          >
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
            <div className="space-y-2 text-right">
              <div className="ml-auto h-4 w-16 rounded bg-slate-200" />
              <div className="ml-auto h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RewardsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="material-stat p-5">
            <div className="h-3 w-16 rounded bg-slate-200" />
            <div className="mt-3 h-7 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="material-card p-5">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-3 rounded-full bg-blue-100/70" />
        <div className="mt-3 h-4 w-48 rounded bg-slate-100" />
      </div>
      <div className="material-card p-5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-[28px] bg-gradient-to-br from-emerald-600/40 to-teal-500/30 px-5 pb-4 pt-5">
        <div className="h-3 w-28 rounded bg-white/20" />
        <div className="mt-2 h-8 w-36 rounded bg-white/25" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/10 px-2 py-3"
            >
              <div className="mx-auto h-2 w-10 rounded bg-white/15" />
              <div className="mx-auto mt-2 h-4 w-14 rounded bg-white/20" />
            </div>
          ))}
        </div>
        <div className="mt-3 h-10 rounded-2xl bg-white/15" />
      </div>
      <div className="material-card p-5">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-28 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
