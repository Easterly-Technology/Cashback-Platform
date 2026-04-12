export default function WalletLoading() {
  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <div className="animate-pulse rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <div className="h-3 w-16 rounded bg-[#2b3139]" />
        <div className="mt-3 h-8 w-32 rounded bg-[#2b3139]" />
        <div className="mt-4 h-24 rounded-lg bg-[#10261f]" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 rounded-md bg-[#0b0e11]" />
          ))}
        </div>
      </div>
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-lg border border-[#1e2329] bg-[#181a20]"
        />
      ))}
    </div>
  );
}
