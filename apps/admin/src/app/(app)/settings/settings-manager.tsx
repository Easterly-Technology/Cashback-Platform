"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SettingsSnapshot = {
  defaultRebatePct: number;
  defaultServiceFeePct: number;
  tokenMultiplier: number;
  tokenReleaseRate: number;
  marketplaceEnabled: boolean;
  marketplacePriceTiers: number[];
  marketplaceDistribution: Record<string, number>;
};

type ChangeEntry = {
  id: string;
  action: string;
  createdAt: string;
  actorLabel: string;
};

export default function SettingsManager({
  initialSettings,
  recentChanges,
  canEdit,
}: {
  initialSettings: SettingsSnapshot;
  recentChanges: ChangeEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    defaultRebatePct: String(initialSettings.defaultRebatePct),
    defaultServiceFeePct: String(initialSettings.defaultServiceFeePct),
    tokenMultiplier: String(initialSettings.tokenMultiplier),
    tokenReleaseRate: String(initialSettings.tokenReleaseRate),
    marketplaceEnabled: initialSettings.marketplaceEnabled,
    marketplacePriceTiers: initialSettings.marketplacePriceTiers.join(", "),
    marketplaceDistribution: JSON.stringify(
      initialSettings.marketplaceDistribution,
      null,
      2,
    ),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        defaultRebatePct: Number(form.defaultRebatePct),
        defaultServiceFeePct: Number(form.defaultServiceFeePct),
        tokenMultiplier: Number(form.tokenMultiplier),
        tokenReleaseRate: Number(form.tokenReleaseRate),
        marketplaceEnabled: form.marketplaceEnabled,
        marketplacePriceTiers: form.marketplacePriceTiers
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isFinite(value)),
        marketplaceDistribution: JSON.parse(form.marketplaceDistribution) as Record<
          string,
          number
        >,
      };

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to update settings");
        setSaving(false);
        return;
      }

      setSaving(false);
      setMessage("Settings updated");
      router.refresh();
    } catch {
      setSaving(false);
      setMessage(
        "Failed to save settings. Check the distribution JSON and tier list.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Platform Controls
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update finance defaults, token release behavior, and exchange configuration from one typed form.
            </p>
          </div>
          {!canEdit ? (
            <span className="material-chip material-chip-muted">Read only</span>
          ) : null}
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Finance Defaults
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Default rebate %</span>
                  <input
                    value={form.defaultRebatePct}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        defaultRebatePct: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Default service fee %</span>
                  <input
                    value={form.defaultServiceFeePct}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        defaultServiceFeePct: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Token Release
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Token multiplier</span>
                  <input
                    value={form.tokenMultiplier}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tokenMultiplier: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Daily release rate %</span>
                  <input
                    value={form.tokenReleaseRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tokenReleaseRate: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Marketplace Configuration
              </h3>
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.marketplaceEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        marketplaceEnabled: event.target.checked,
                      }))
                    }
                    disabled={!canEdit}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Enable exchange marketplace
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Price tiers</span>
                  <input
                    value={form.marketplacePriceTiers}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        marketplacePriceTiers: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-600">
                  <span>Distribution JSON</span>
                  <textarea
                    value={form.marketplaceDistribution}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        marketplaceDistribution: event.target.value,
                      }))
                    }
                    disabled={!canEdit}
                    className="min-h-52 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs"
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Change History
              </h3>
              <div className="mt-4 space-y-3">
                {recentChanges.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No settings changes recorded yet.
                  </p>
                ) : (
                  recentChanges.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {entry.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.actorLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Validation Notes
              </h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <li>Percent fields should be entered as human values like 10 or 0.5.</li>
                <li>Price tiers should be comma-separated values such as `0.10, 0.20, 0.50`.</li>
                <li>Distribution JSON should total close to `1` for predictable pool generation.</li>
              </ul>
            </section>
          </div>
        </div>

        {canEdit ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="material-button-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
