type AuditLogFeedItem = {
  id: bigint | number | string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: unknown;
  createdAt: Date;
};

function formatJson(value: unknown) {
  if (!value) return "—";
  return JSON.stringify(value, null, 2);
}

export function AuditLogFeed({
  logs,
  emptyMessage,
}: {
  logs: AuditLogFeedItem[];
  emptyMessage: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="material-empty px-6 py-10 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={String(log.id)} className="material-card-flat p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
              {log.actorType}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {log.resourceType}
            </span>
            <span className="text-xs text-slate-400">
              {log.createdAt.toLocaleString()}
            </span>
          </div>
          <p className="mt-3 font-mono text-xs text-slate-600">{log.action}</p>
          <p className="mt-1 text-sm text-slate-700">
            Actor: {log.actorId}
            {log.resourceId ? ` · Resource: ${log.resourceId}` : ""}
          </p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-200">
            {formatJson(log.details)}
          </pre>
        </div>
      ))}
    </div>
  );
}
