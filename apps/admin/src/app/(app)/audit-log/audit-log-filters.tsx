"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(currentActorType || currentAction || currentResourceType),
  );

  useEffect(() => {
    setActorType(currentActorType ?? "all");
    setResourceType(currentResourceType ?? "all");
    setAction(currentAction ?? "");
    setQuery(currentQuery ?? "");
    setShowAdvanced(Boolean(currentActorType || currentAction || currentResourceType));
  }, [currentAction, currentActorType, currentQuery, currentResourceType]);

  const activeFilters = useMemo(() => {
    const items: string[] = [];

    if (query.trim()) items.push(`Search: ${query.trim()}`);
    if (actorType !== "all") items.push(`Actor: ${actorType}`);
    if (resourceType !== "all") items.push(`Resource: ${resourceType}`);
    if (action.trim()) items.push(`Action: ${action.trim()}`);

    return items;
  }, [action, actorType, query, resourceType]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (actorType !== "all") params.set("actorType", actorType);
    else params.delete("actorType");

    if (resourceType !== "all") params.set("resourceType", resourceType);
    else params.delete("resourceType");

    if (action.trim()) params.set("action", action.trim());
    else params.delete("action");

    if (query.trim()) params.set("query", query.trim());
    else params.delete("query");

    const href = params.toString();
    router.push(href ? `/audit-log?${href}` : "/audit-log");
  }

  function clearFilters() {
    setActorType("all");
    setResourceType("all");
    setAction("");
    setQuery("");
    setShowAdvanced(false);
    router.push("/audit-log");
  }

  return (
    <div className="mb-5 space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
        className="sticky top-20 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-700">Filter activity</p>
            {activeFilters.length > 0 ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {activeFilters.length} active
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="material-button-outlined min-h-10 px-3 py-2 text-xs font-semibold sm:text-sm"
            >
              {showAdvanced ? "Hide filters" : "More filters"}
            </button>
            {activeFilters.length > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <input
            placeholder="Search actor, resource, or action..."
            aria-label="Search audit activity"
            className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="material-button-primary min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
          >
            Apply filters
          </button>
        </div>

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                title={filter}
                className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:max-w-[20rem]"
              >
                {filter}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Search across actor IDs, resource IDs, labels, and action keywords.
          </p>
        )}
      </form>

      {showAdvanced ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="grid gap-3 md:grid-cols-3">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
