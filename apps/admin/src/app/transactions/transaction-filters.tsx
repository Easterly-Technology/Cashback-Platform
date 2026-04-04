"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TransactionFilters({
  currentStatus,
  currentFrom,
  currentTo,
}: {
  currentStatus?: string;
  currentFrom?: string;
  currentTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(currentStatus ?? "all");
  const [from, setFrom] = useState(currentFrom ?? "");
  const [to, setTo] = useState(currentTo ?? "");

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (status !== "all") params.set("status", status);
    else params.delete("status");

    if (from) params.set("from", from);
    else params.delete("from");

    if (to) params.set("to", to);
    else params.delete("to");

    router.push(`/transactions?${params.toString()}`);
  }

  function clearFilters() {
    setStatus("all");
    setFrom("");
    setTo("");
    router.push("/transactions");
  }

  return (
    <div className="material-card sticky top-24 z-20 mb-5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">Filter transactions</p>
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Clear
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <select
          className="px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="DISPUTED">Disputed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 text-sm"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 text-sm"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={applyFilters}
        className="material-button-primary mt-3 min-h-11 w-full px-4 py-2 text-sm font-semibold transition hover:translate-y-[-1px] md:w-auto"
      >
        Apply Filters
      </button>
    </div>
  );
}
