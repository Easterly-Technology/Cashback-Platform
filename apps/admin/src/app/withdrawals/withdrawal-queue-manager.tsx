"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@cashback/shared";
import { WithdrawalStatusActions } from "./withdrawal-status-actions";

type WithdrawalRow = {
  id: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  processedAt: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    payoutLabel: string | null;
    payoutSubLabel: string | null;
    payoutAccount: string | null;
  };
};

function statusClass(status: WithdrawalRow["status"]) {
  switch (status) {
    case "COMPLETED":
      return "status-badge status-badge-success";
    case "APPROVED":
      return "status-badge status-badge-info";
    case "REJECTED":
      return "status-badge status-badge-danger";
    default:
      return "status-badge status-badge-warning";
  }
}

export default function WithdrawalQueueManager({
  requests,
}: {
  requests: WithdrawalRow[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allSelected =
    requests.length > 0 && selectedIds.length === requests.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function applyBulkStatus(status: "APPROVED" | "REJECTED" | "COMPLETED") {
    if (selectedIds.length === 0) {
      setMessage("Select at least one withdrawal first.");
      return;
    }

    setLoadingStatus(status);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/withdrawals/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds, status }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; updatedCount?: number; skippedCount?: number }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Bulk update failed");
        setLoadingStatus(null);
        return;
      }

      setSelectedIds([]);
      setLoadingStatus(null);
      setMessage(
        `${data?.updatedCount ?? 0} request(s) updated${
          data?.skippedCount ? `, ${data.skippedCount} skipped` : ""
        }`,
      );
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
              onClick={() => void applyBulkStatus("APPROVED")}
              disabled={loadingStatus !== null}
              className="material-button-tonal px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
            >
              {loadingStatus === "APPROVED" ? "Updating..." : "Approve"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkStatus("COMPLETED")}
              disabled={loadingStatus !== null}
              className="material-button-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loadingStatus === "COMPLETED" ? "Updating..." : "Complete"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkStatus("REJECTED")}
              disabled={loadingStatus !== null}
              className="material-button-outlined px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50"
            >
              {loadingStatus === "REJECTED" ? "Updating..." : "Reject"}
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
      </div>

      {requests.length === 0 ? (
        <div className="material-empty px-6 py-10 text-center">
          <p className="text-base font-medium text-slate-700">
            No withdrawal requests match the current view.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try another preset or status filter to widen the queue.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 xl:hidden">
            {requests.map((requestEntry) => (
              <div key={requestEntry.id} className="material-card-flat p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(requestEntry.id)}
                      onChange={() => toggleSelection(requestEntry.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div>
                      <Link
                        href={`/withdrawals/${requestEntry.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-700"
                      >
                        {requestEntry.user.name}
                      </Link>
                      <p className="text-sm text-slate-500">{requestEntry.user.email}</p>
                    </div>
                  </div>
                  <span className={statusClass(requestEntry.status)}>
                    {requestEntry.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-slate-500">Amount</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatCurrency(requestEntry.amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-slate-500">Payout Details</p>
                    {requestEntry.user.payoutLabel ? (
                      <>
                        <p className="mt-1 font-semibold text-slate-900">
                          {requestEntry.user.payoutLabel}
                        </p>
                        <p className="mt-1 text-slate-600">
                          {requestEntry.user.payoutSubLabel}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {requestEntry.user.payoutAccount}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-slate-400">No payout details saved</p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-slate-500">Timeline</p>
                    <p className="mt-1 text-slate-900">
                      Requested {new Date(requestEntry.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {requestEntry.processedAt
                        ? `Updated ${new Date(requestEntry.processedAt).toLocaleString()}`
                        : "Awaiting admin action"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <WithdrawalStatusActions
                    id={requestEntry.id}
                    status={requestEntry.status}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="material-table-shell hidden xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelectedIds(
                            allSelected ? [] : requests.map((requestEntry) => requestEntry.id),
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payout Details</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Processed</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((requestEntry) => (
                    <tr key={requestEntry.id} className="border-b border-slate-100 align-top">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(requestEntry.id)}
                          onChange={() => toggleSelection(requestEntry.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/withdrawals/${requestEntry.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-700"
                        >
                          {requestEntry.user.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {requestEntry.user.email}
                        </p>
                      </td>
                      <td className="p-4 font-medium text-slate-950">
                        {formatCurrency(requestEntry.amount)}
                      </td>
                      <td className="p-4">
                        {requestEntry.user.payoutLabel ? (
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">
                              {requestEntry.user.payoutLabel}
                            </p>
                            <p className="text-xs text-slate-500">
                              {requestEntry.user.payoutSubLabel}
                            </p>
                            <p className="font-mono text-xs text-slate-400">
                              {requestEntry.user.payoutAccount}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No payout details saved
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(requestEntry.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-500">
                        {requestEntry.processedAt
                          ? new Date(requestEntry.processedAt).toLocaleString()
                          : "Awaiting action"}
                      </td>
                      <td className="p-4">
                        <span className={statusClass(requestEntry.status)}>
                          {requestEntry.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <WithdrawalStatusActions
                          id={requestEntry.id}
                          status={requestEntry.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
