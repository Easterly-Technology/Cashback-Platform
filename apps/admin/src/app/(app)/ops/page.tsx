import Link from "next/link";
import { alertTone, getOpsAlerts } from "@/lib/ops";

export const dynamic = "force-dynamic";

export default async function OpsInboxPage() {
  const alerts = await getOpsAlerts();

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Operations Inbox</span>
        <h1 className="material-title mt-4 text-slate-950">Operations Inbox</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Exceptions from approvals, withdrawals, settlements, exchange generation, and account health are collected here with direct follow-up links.
        </p>
      </div>

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Open Alerts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Each item includes severity, age, source, and the fastest path to the affected record.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {alerts.length.toLocaleString()} alerts
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No operational alerts right now.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              The approval queue, payouts, and automation all look clear.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={alert.href}
                className={`block rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 ${alertTone(alert.severity)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {alert.severity}
                    </span>
                    <span className="text-xs font-medium opacity-80">
                      {alert.source}
                    </span>
                  </div>
                  <span className="text-xs opacity-80">{alert.age}</span>
                </div>
                <p className="mt-3 text-base font-semibold">{alert.title}</p>
                <p className="mt-2 text-sm leading-6 opacity-80">{alert.reason}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
