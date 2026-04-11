"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const transitionOptions = {
  PENDING: [
    { value: "INVOICED", label: "Mark Invoiced", className: "material-button-tonal text-indigo-700" },
    { value: "PAID", label: "Mark Paid", className: "material-button-primary text-white" },
  ],
  INVOICED: [
    { value: "PENDING", label: "Reopen", className: "material-button-tonal text-indigo-700" },
    { value: "PAID", label: "Mark Paid", className: "material-button-primary text-white" },
  ],
  PAID: [],
} as const;

export function SettlementActions({
  id,
  status,
  initialInvoiceReference,
}: {
  id: string;
  status: "PENDING" | "INVOICED" | "PAID";
  initialInvoiceReference?: string | null;
}) {
  const router = useRouter();
  const [invoiceReference, setInvoiceReference] = useState(
    initialInvoiceReference ?? "",
  );
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const options = transitionOptions[status];

  async function updateSettlement(payload: {
    status?: string;
    invoiceReference?: string | null;
  }) {
    setLoadingState(payload.status ?? "invoice");
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/settlements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to update settlement");
        setLoadingState(null);
        return;
      }

      setLoadingState(null);
      setMessage("Settlement updated");
      router.refresh();
    } catch {
      setLoadingState(null);
      setMessage("Failed to update settlement");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={invoiceReference}
          onChange={(event) => setInvoiceReference(event.target.value)}
          placeholder="Invoice ref"
          className="min-w-40 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700"
        />
        <button
          type="button"
          onClick={() =>
            void updateSettlement({
              invoiceReference: invoiceReference.trim() || null,
            })
          }
          disabled={loadingState !== null}
          className="material-button-outlined px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
        >
          {loadingState === "invoice" ? "Saving..." : "Save Ref"}
        </button>
      </div>
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                void updateSettlement({
                  status: option.value,
                  invoiceReference: invoiceReference.trim() || null,
                })
              }
              disabled={loadingState !== null}
              className={`${option.className} px-3 py-2 text-xs font-semibold disabled:opacity-50`}
            >
              {loadingState === option.value ? "Updating..." : option.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">No further actions</p>
      )}
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
