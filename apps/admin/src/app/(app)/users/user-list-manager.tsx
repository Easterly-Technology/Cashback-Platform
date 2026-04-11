"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  totalSpending: number;
  entitledTokens: number;
  availableTokens: number;
};

function statusClass(status: UserRow["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

export default function UserListManager({
  users,
  canBulkManage,
}: {
  users: UserRow[];
  canBulkManage: boolean;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const allSelected =
    users.length > 0 && selectedIds.length === users.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function applyBulkStatus(status: UserRow["status"]) {
    if (selectedIds.length === 0) {
      setMessage("Select at least one user first.");
      return;
    }

    setLoadingStatus(status);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users/bulk", {
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
      setMessage(`${data?.updatedCount ?? 0} user(s) updated`);
      router.refresh();
    } catch {
      setLoadingStatus(null);
      setMessage("Bulk update failed");
    }
  }

  return (
    <div className="space-y-4">
      {canBulkManage ? (
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
                {loadingStatus === "ACTIVE" ? "Updating..." : "Reactivate"}
              </button>
              <button
                type="button"
                onClick={() => void applyBulkStatus("SUSPENDED")}
                disabled={loadingStatus !== null}
                className="material-button-tonal px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
              >
                {loadingStatus === "SUSPENDED" ? "Updating..." : "Suspend"}
              </button>
              <button
                type="button"
                onClick={() => void applyBulkStatus("BANNED")}
                disabled={loadingStatus !== null}
                className="material-button-outlined px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50"
              >
                {loadingStatus === "BANNED" ? "Updating..." : "Ban"}
              </button>
            </div>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}
        </div>
      ) : null}

      <div className="space-y-4 lg:hidden">
        {users.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No users have registered yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Once customers start using the platform, their spend and entitlement snapshots will appear here.
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {canBulkManage ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelection(user.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                  ) : null}
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(user.status)}`}
                >
                  {user.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Total Spending</p>
                  <p className="mt-1 font-medium text-slate-900">
                    RM{user.totalSpending.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-slate-500">Entitled Tokens</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {user.entitledTokens.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 rounded-2xl bg-slate-950 p-3 text-white">
                  <p className="text-slate-300">Available Tokens</p>
                  <p className="mt-1 text-lg font-semibold">
                    {user.availableTokens.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <Link
                  href={`/users/${user.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {users.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  {canBulkManage ? (
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() =>
                          setSelectedIds(allSelected ? [] : users.map((user) => user.id))
                        }
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </th>
                  ) : null}
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Total Spending</th>
                  <th className="p-4">Entitled Tokens</th>
                  <th className="p-4">Available Tokens</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {canBulkManage ? (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => toggleSelection(user.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                    ) : null}
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-slate-500">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">RM{user.totalSpending.toLocaleString()}</td>
                    <td className="p-4">{user.entitledTokens.toLocaleString()}</td>
                    <td className="p-4">{user.availableTokens.toLocaleString()}</td>
                    <td className="p-4">
                      <Link
                        href={`/users/${user.id}`}
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
