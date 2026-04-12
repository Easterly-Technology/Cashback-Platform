import { formatTokenAmount, getReleaseForecast } from "@/lib/reward-journey";

interface ReleaseForecastCardProps {
  entitledTokens: number;
  releasedTokens: number;
  availableTokens: number;
  releaseRate: number;
}

export function ReleaseForecastCard({
  entitledTokens,
  releasedTokens,
  availableTokens,
  releaseRate,
}: ReleaseForecastCardProps) {
  const forecast = getReleaseForecast({
    entitledTokens,
    releasedTokens,
    releaseRate,
  });
  const isFullyReleased = entitledTokens > 0 && forecast.remainingTokens <= 0;

  return (
    <section className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Release Forecast</h2>
          <p className="mt-1 text-xs leading-5 text-[#848e9c]">
            Ready now, next week, and full release timing.
          </p>
        </div>
        <span className="shrink-0 rounded bg-[#2b3139] px-2 py-1 font-mono text-xs font-bold text-[#f0b90b]">
          {(releaseRate * 100).toLocaleString()}%
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ForecastStat
          label="Next"
          value={
            forecast.nextRelease > 0
              ? `+${formatTokenAmount(forecast.nextRelease)}`
              : "0"
          }
          tone="yellow"
        />
        <ForecastStat
          label="7 days"
          value={`+${formatTokenAmount(forecast.nextSevenDays)}`}
          tone="green"
        />
        <ForecastStat
          label="Done"
          value={
            isFullyReleased
              ? "Now"
              : `~${forecast.daysRemaining.toLocaleString()}d`
          }
          tone="gray"
        />
      </div>

      <div className="mt-4 rounded-md border border-[#2b3139] bg-[#0b0e11] px-4 py-3 text-sm leading-6 text-[#b7bdc6]">
        {entitledTokens <= 0 ? (
          "Confirm a merchant QR after purchase to begin the release journey."
        ) : (
          <>
            <span className="font-semibold text-white">
              {formatTokenAmount(availableTokens)} CBT are usable now.
            </span>{" "}
            Around {formatTokenAmount(forecast.nextThirtyDays)} more can unlock
            over the next 30 days.
          </>
        )}
      </div>
    </section>
  );
}

function ForecastStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "yellow" | "green" | "gray";
}) {
  const toneClass = {
    yellow: "border-[#f0b90b]/40 bg-[#2b2615] text-[#f0b90b]",
    green: "border-[#0ecb81]/40 bg-[#10261f] text-[#0ecb81]",
    gray: "border-[#2b3139] bg-[#0b0e11] text-[#eaecef]",
  }[tone];

  return (
    <div className={`rounded-md border px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase opacity-70">{label}</p>
      <p className="mt-1 font-mono text-sm font-bold">{value}</p>
    </div>
  );
}