"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const transitionOptions = {
  PENDING: [
    { value: "APPROVED", label: "Approve", className: "material-button-tonal text-indigo-700" },
    { value: "REJECTED", label: "Reject", className: "material-button-outlined text-rose-600" },
  ],
  APPROVED: [
    { value: "COMPLETED", label: "Complete", className: "material-button-primary text-white" },
    { value: "REJECTED", label: "Reject", className: "material-button-outlined text-rose-600" },
  ],
  REJECTED: [],
  COMPLETED: [],
} as const;

export function WithdrawalStatusActions({
  id,
  status,
}: {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
}) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const options = transitionOptions[status];

  async function updateStatus(nextStatus: string) {
    setLoadingStatus(nextStatus);
    setError("");

    const response = await fetch(`/api/admin/withdrawals/${id}`, {
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
      setError(data?.error ?? "Failed to update withdrawal");
      setLoadingStatus(null);
      return;
    }

    setLoadingStatus(null);
    router.refresh();
  }

  if (options.length === 0) {
    return (
      <div className="text-xs text-slate-400">
        No further actions
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => void updateStatus(option.value)}
            disabled={loadingStatus !== null}
            className={`${option.className} px-3 py-2 text-xs font-semibold disabled:opacity-50`}
          >
            {loadingStatus === option.value ? "Updating..." : option.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
