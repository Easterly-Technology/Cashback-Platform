import {
  formatTokenAmount,
  getReleaseForecast,
} from "@/lib/reward-journey";

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
  const isFullyReleased =
    entitledTokens > 0 && forecast.remainingTokens <= 0;

  return (
    <div className="material-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Release Forecast
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            See what is ready now, what unlocks next, and when the queue clears.
          </p>
        </div>
        <span className="material-chip shrink-0">
          {(releaseRate * 100).toLocaleString()}% daily
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
          tone="blue"
        />
        <ForecastStat
          label="7 days"
          value={`+${formatTokenAmount(forecast.nextSevenDays)}`}
          tone="emerald"
        />
        <ForecastStat
          label="Fully released"
          value={
            isFullyReleased
              ? "Now"
              : `~${forecast.daysRemaining.toLocaleString()}d`
          }
          tone="slate"
        />
      </div>

      <div className="mt-4 rounded-2xl bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900">
        {entitledTokens <= 0 ? (
          "No token entitlement yet. Confirm a merchant QR after purchase to begin the release journey."
        ) : (
          <>
            <span className="font-semibold">
              {formatTokenAmount(availableTokens)} tokens are usable now.
            </span>{" "}
            Around {formatTokenAmount(forecast.nextThirtyDays)} more tokens can
            unlock over the next 30 days.
          </>
        )}
      </div>
    </div>
  );
}

function ForecastStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    slate: "bg-slate-50 text-slate-700",
  }[tone];

  return (
    <div className={`rounded-2xl px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
