import Link from "next/link";
import { prisma } from "@cashback/database";
import { PaginationControls } from "@/components/pagination-controls";
import AuditLogFilters from "./audit-log-filters";

export const dynamic = "force-dynamic";

const VIEW_OPTIONS = [
  { label: "All Activity", value: "all" },
  { label: "Admin Changes", value: "admin" },
  { label: "Finance", value: "finance" },
  { label: "Automation", value: "automation" },
] as const;

function formatDateTime(value: Date) {
  return value.toLocaleString();
}

function formatJson(value: unknown) {
  if (!value) return "—";

  return JSON.stringify(value, null, 2);
}

function buildAuditWhere(params: {
  actorType?: string;
  action?: string;
  resourceType?: string;
  query?: string;
  view?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.view === "admin" && !params.actorType) {
    where.actorType = "ADMIN";
  }

  if (params.view === "finance" && !params.resourceType) {
    where.resourceType = { in: ["WITHDRAWAL_REQUEST", "SETTLEMENT"] };
  }

  if (params.view === "automation" && !params.resourceType && !params.action) {
    where.OR = [
      { action: { contains: "JOB" } },
      { action: { contains: "CRON" } },
      { resourceType: "SYSTEM_JOB" },
    ];
  }

  if (params.actorType && params.actorType !== "all") {
    where.actorType = params.actorType;
  }
  if (params.action) {
    where.action = { contains: params.action };
  }
  if (params.resourceType && params.resourceType !== "all") {
    where.resourceType = params.resourceType;
  }
  if (params.query) {
    where.OR = [
      { actorId: { contains: params.query } },
      { resourceId: { contains: params.query } },
      { action: { contains: params.query } },
      { resourceType: { contains: params.query } },
    ];
  }

  return where;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    actorType?: string;
    action?: string;
    resourceType?: string;
    query?: string;
    view?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
  const pageSize = 25;
  const where = buildAuditWhere(params);

  const [logs, totalCount, resourceTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["resourceType"],
      select: { resourceType: true },
      orderBy: { resourceType: "asc" },
    }),
  ]);

  const userActorIds = Array.from(
    new Set(
      logs.filter((log) => log.actorType === "USER").map((log) => log.actorId),
    ),
  );
  const merchantActorIds = Array.from(
    new Set(
      logs
        .filter((log) => log.actorType === "MERCHANT")
        .map((log) => log.actorId),
    ),
  );
  const adminActorIds = Array.from(
    new Set(
      logs.filter((log) => log.actorType === "ADMIN").map((log) => log.actorId),
    ),
  );
  const userResourceIds = Array.from(
    new Set(
      logs
        .filter((log) => log.resourceType === "USER" && log.resourceId)
        .map((log) => log.resourceId as string),
    ),
  );
  const merchantResourceIds = Array.from(
    new Set(
      logs
        .filter((log) => log.resourceType === "MERCHANT" && log.resourceId)
        .map((log) => log.resourceId as string),
    ),
  );
  const productResourceIds = Array.from(
    new Set(
      logs
        .filter((log) => log.resourceType === "PRODUCT" && log.resourceId)
        .map((log) => log.resourceId as string),
    ),
  );
  const transactionResourceIds = Array.from(
    new Set(
      logs
        .filter(
          (log) =>
            (log.resourceType === "TRANSACTION" ||
              log.resourceType === "TRANSACTION_QR") &&
            log.resourceId,
        )
        .map((log) => log.resourceId as string),
    ),
  );

  const [
    users,
    merchants,
    admins,
    resourceUsers,
    resourceMerchants,
    products,
    transactions,
  ] = await Promise.all([
    userActorIds.length === 0
      ? []
      : prisma.user.findMany({
          where: { id: { in: userActorIds } },
          select: { id: true, email: true, name: true },
        }),
    merchantActorIds.length === 0
      ? []
      : prisma.merchant.findMany({
          where: { id: { in: merchantActorIds } },
          select: { id: true, name: true, contactEmail: true },
        }),
    adminActorIds.length === 0
      ? []
      : prisma.admin.findMany({
          where: { id: { in: adminActorIds } },
          select: { id: true, email: true, role: true },
        }),
    userResourceIds.length === 0
      ? []
      : prisma.user.findMany({
          where: { id: { in: userResourceIds } },
          select: { id: true, email: true, name: true },
        }),
    merchantResourceIds.length === 0
      ? []
      : prisma.merchant.findMany({
          where: { id: { in: merchantResourceIds } },
          select: { id: true, name: true },
        }),
    productResourceIds.length === 0
      ? []
      : prisma.product.findMany({
          where: { id: { in: productResourceIds } },
          select: { id: true, name: true },
        }),
    transactionResourceIds.length === 0
      ? []
      : prisma.transaction.findMany({
          where: { id: { in: transactionResourceIds } },
          select: { id: true, totalAmount: true },
        }),
  ]);

  const actorLabels = new Map<string, string>();
  const resourceLabels = new Map<string, string>();

  users.forEach((user) =>
    actorLabels.set(`USER:${user.id}`, `${user.name} · ${user.email}`),
  );
  merchants.forEach((merchant) =>
    actorLabels.set(
      `MERCHANT:${merchant.id}`,
      `${merchant.name} · ${merchant.contactEmail}`,
    ),
  );
  admins.forEach((admin) =>
    actorLabels.set(`ADMIN:${admin.id}`, `${admin.email} · ${admin.role}`),
  );
  resourceUsers.forEach((user) =>
    resourceLabels.set(`USER:${user.id}`, `${user.name} · ${user.email}`),
  );
  resourceMerchants.forEach((merchant) =>
    resourceLabels.set(`MERCHANT:${merchant.id}`, merchant.name),
  );
  products.forEach((product) =>
    resourceLabels.set(`PRODUCT:${product.id}`, product.name),
  );
  transactions.forEach((transaction) => {
    const label = `Order RM${Number(transaction.totalAmount).toLocaleString()}`;
    resourceLabels.set(`TRANSACTION:${transaction.id}`, label);
    resourceLabels.set(`TRANSACTION_QR:${transaction.id}`, label);
  });

  const baseParams = {
    actorType: params.actorType,
    action: params.action,
    resourceType: params.resourceType,
    query: params.query,
    view: params.view,
  };

  const exportParams = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value) exportParams.set(key, value);
  });

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Audit Log
          </h1>
          <p className="text-sm text-slate-500">
            Review actor, action, resource, payload details, and saved activity views across recent platform operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            Showing {logs.length} of {totalCount.toLocaleString()} entries
          </div>
          <Link
            href={`/api/admin/audit-log/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`}
            className="material-button-outlined px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <div className="material-card p-5">
        <div className="flex flex-wrap gap-2">
          {VIEW_OPTIONS.map((option) => {
            const active = (params.view ?? "all") === option.value;
            const href = new URLSearchParams();

            if (option.value !== "all") {
              href.set("view", option.value);
            }

            return (
              <Link
                key={option.value}
                href={href.toString() ? `/audit-log?${href.toString()}` : "/audit-log"}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      <AuditLogFilters
        currentActorType={params.actorType}
        currentAction={params.action}
        currentResourceType={params.resourceType}
        currentQuery={params.query}
        resourceTypes={resourceTypes.map((entry) => entry.resourceType)}
      />

      <div className="space-y-4 lg:hidden">
        {logs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-base font-medium text-slate-700">
              No audit logs match these filters.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try widening the actor, resource, or view filters to bring older records back into view.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={String(log.id)}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                    {log.actorType}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {log.resourceType}
                  </span>
                </div>
                <p className="mt-3 font-mono text-xs text-slate-500">
                  {formatDateTime(log.createdAt)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {log.action}
                </p>
              </div>
              <div className="space-y-4 px-4 py-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Actor
                  </p>
                  <p className="mt-1 text-slate-800">
                    {actorLabels.get(`${log.actorType}:${log.actorId}`) ??
                      log.actorId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Resource
                  </p>
                  <p className="mt-1 text-slate-800">
                    {log.resourceId
                      ? resourceLabels.get(`${log.resourceType}:${log.resourceId}`) ??
                        log.resourceId
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Details
                  </p>
                  <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                    {formatJson(log.details)}
                  </pre>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-slate-500">
                  <th className="p-4">Created</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Resource</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={String(log.id)} className="border-b border-slate-100 align-top">
                    <td className="p-4 text-xs text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{log.actorType}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {actorLabels.get(`${log.actorType}:${log.actorId}`) ??
                          log.actorId}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{log.action}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">
                        {log.resourceType}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {log.resourceId
                          ? resourceLabels.get(`${log.resourceType}:${log.resourceId}`) ??
                            log.resourceId
                          : "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <pre className="max-w-xl overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs leading-5 text-slate-100">
                        {formatJson(log.details)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <PaginationControls
        pathname="/audit-log"
        params={baseParams}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  );
}
