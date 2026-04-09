import { HomeSummaryHeaderSkeleton } from "@/components/home/home-summary-header";
import { OverviewSkeleton } from "@/components/home/tab-skeletons";

export default function Loading() {
  return (
    <div className="space-y-3 py-4">
      <HomeSummaryHeaderSkeleton />

      {/* Tab bar placeholder */}
      <div className="flex gap-1 rounded-[20px] border border-white/78 bg-white/82 px-1.5 py-1.5">
        {["Overview", "Activity", "Rewards", "Wallet"].map((label) => (
          <div
            key={label}
            className="shrink-0 rounded-[14px] px-4 py-2.5 text-sm font-semibold text-slate-300"
          >
            {label}
          </div>
        ))}
      </div>

      <OverviewSkeleton />
    </div>
  );
}
