"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActionOption = {
  value: string;
  label: string;
  tone?: "primary" | "neutral" | "danger";
};

const toneClasses: Record<NonNullable<ActionOption["tone"]>, string> = {
  primary: "material-button-primary text-white",
  neutral: "material-button-tonal text-indigo-700",
  danger: "material-button-outlined text-rose-600",
};

export function EntityStatusActions({
  endpoint,
  currentStatus,
  options,
  emptyLabel = "No actions available",
}: {
  endpoint: string;
  currentStatus: string;
  options: ActionOption[];
  emptyLabel?: string;
}) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  async function updateStatus(nextStatus: string) {
    if (nextStatus === currentStatus) return;

    setLoadingStatus(nextStatus);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to update status");
        setLoadingStatus(null);
        return;
      }

      setLoadingStatus(null);
      router.refresh();
    } catch {
      setError("Failed to update status");
      setLoadingStatus(null);
    }
  }

  if (options.length === 0) {
    return <p className="text-xs text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => void updateStatus(option.value)}
            disabled={loadingStatus !== null || option.value === currentStatus}
            className={`${toneClasses[option.tone ?? "neutral"]} px-3 py-2 text-xs font-semibold disabled:opacity-50`}
          >
            {loadingStatus === option.value ? "Updating..." : option.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
