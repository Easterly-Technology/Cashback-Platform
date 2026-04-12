import { HomeSummaryHeaderSkeleton } from "@/features/home/components/home-summary-header";

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <HomeSummaryHeaderSkeleton />

      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-lg border border-[#1e2329] bg-[#181a20]"
        />
      ))}
    </div>
  );
}
