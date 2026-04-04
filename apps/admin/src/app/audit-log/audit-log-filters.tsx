"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuditLogFilters({
  currentActorType,
  currentAction,
  currentResourceType,
  currentQuery,
  resourceTypes,
}: {
  currentActorType?: string;
  currentAction?: string;
  currentResourceType?: string;
  currentQuery?: string;
  resourceTypes: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actorType, setActorType] = useState(currentActorType ?? "all");
  const [resourceType, setResourceType] = useState(currentResourceType ?? "all");
  const [action, setAction] = useState(currentAction ?? "");
  const [query, setQuery] = useState(currentQuery ?? "");

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (actorType !== "all") params.set("actorType", actorType);
    else params.delete("actorType");

    if (resourceType !== "all") params.set("resourceType", resourceType);
    else params.delete("resourceType");

    if (action.trim()) params.set("action", action.trim());
    else params.delete("action");

    if (query.trim()) params.set("query", query.trim());
    else params.delete("query");

    router.push(`/audit-log?${params.toString()}`);
  }

  function clearFilters() {
    setActorType("all");
    setResourceType("all");
    setAction("");
    setQuery("");
    router.push("/audit-log");
  }

  return (
    <div className="sticky top-20 z-20 mb-5 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">Filter activity</p>
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Clear
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={actorType}
          onChange={(e) => setActorType(e.target.value)}
        >
          <option value="all">All Actors</option>
          <option value="USER">USER</option>
          <option value="MERCHANT">MERCHANT</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SYSTEM">SYSTEM</option>
        </select>
        <select
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        >
          <option value="all">All Resources</option>
          {resourceTypes.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          placeholder="Filter action..."
          className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />
        <input
          placeholder="Search IDs or labels..."
          className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={applyFilters}
        className="mt-3 min-h-11 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 md:w-auto"
      >
        Apply Filters
      </button>
    </div>
  );
}
