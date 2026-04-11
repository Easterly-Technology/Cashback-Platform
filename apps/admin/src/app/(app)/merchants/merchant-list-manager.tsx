"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type MerchantRow = {
  id: string;
  name: string;
  contactEmail: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  rebatePct: number;
  serviceFeePct: number;
  amountOwed: number;
};

function statusClass(status: MerchantRow["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default function MerchantListManager({
  merchants,
}: {
  merchants: MerchantRow[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allSelected =
    merchants.length > 0 && selectedIds.length === merchants.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function applyBulkStatus(status: MerchantRow["status"]) {
    if (selectedIds.length === 0) {
      setMessage("Select at least one merchant first.");
      return;
    }

    setLoadingStatus(status);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/merchants/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds, status }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; updatedCount?: number }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Bulk update failed");
        setLoadingStatus(null);
        return;
      }

      setSelectedIds([]);
      setLoadingStatus(null);
      setMessage(`${data?.updatedCount ?? 0} merchant(s) updated`);
      router.refresh();
    } catch {
      setLoadingStatus(null);
      setMessage("Bulk update failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="material-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {selectedIds.length.toLocaleString()} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void applyBulkStatus("ACTIVE")}
              disabled={loadingStatus !== null}
              className="material-button-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loadingStatus === "ACTIVE" ? "Updating..." : "Activate"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkStatus("PENDING")}
              disabled={loadingStatus !== null}
              className="material-button-tonal px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
            >
              {loadingStatus === "PENDING" ? "Updating..." : "Move to Pending"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkStatus("SUSPENDED")}
              disabled={loadingStatus !== null}
              className="material-button-outlined px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50"
            >
              {loadingStatus === "SUSPENDED" ? "Updating..." : "Suspend"}
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      </div>

      <div className="space-y-4 lg:hidden">
        {merchants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No merchants have been onboarded yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Add your first merchant to start issuing QR sales and settlement records.
            </p>
          </div>
        ) : (
          merchants.map((merchant) => (
            <div
              key={merchant.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(merchant.id)}
                    onChange={() => toggleSelection(merchant.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{merchant.name}</p>
                    <p className="text-sm text-slate-500">{merchant.contactEmail}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(merchant.status)}`}
                >
                  {merchant.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Rebate</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {merchant.rebatePct.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Service Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {merchant.serviceFeePct.toFixed(1)}%
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Amount Owed</p>
                  <p className="mt-1 text-lg font-semibold">
                    RM{merchant.amountOwed.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <Link
                  href={`/merchants/${merchant.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {merchants.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelectedIds(
                          allSelected ? [] : merchants.map((merchant) => merchant.id),
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Rebate %</th>
                  <th className="p-4">Service Fee</th>
                  <th className="p-4">Amount Owed</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(merchant.id)}
                        onChange={() => toggleSelection(merchant.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </td>
                    <td className="p-4 font-medium">{merchant.name}</td>
                    <td className="p-4 text-slate-500">{merchant.contactEmail}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(merchant.status)}`}
                      >
                        {merchant.status}
                      </span>
                    </td>
                    <td className="p-4">{merchant.rebatePct.toFixed(1)}%</td>
                    <td className="p-4">{merchant.serviceFeePct.toFixed(1)}%</td>
                    <td className="p-4 font-medium">
                      RM{merchant.amountOwed.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/merchants/${merchant.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
