import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency, parseBankInfo } from "@cashback/shared";
import { AdminNotesPanel } from "@/components/admin-notes-panel";
import { AuditLogFeed } from "@/components/audit-log-feed";
import { WithdrawalStatusActions } from "@/app/withdrawals/withdrawal-status-actions";

export const dynamic = "force-dynamic";

export default async function WithdrawalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [withdrawal, auditLogs, adminNotes] = await Promise.all([
    prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bankInfo: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        resourceType: "WITHDRAWAL_REQUEST",
        resourceId: id,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.adminNote.findMany({
      where: {
        resourceType: "WITHDRAWAL_REQUEST",
        resourceId: id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      take: 20,
    }),
  ]);

  if (!withdrawal) notFound();

  const bankInfo = parseBankInfo(withdrawal.user.bankInfo);

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Withdrawal Detail</span>
            <h1 className="material-title mt-4 text-slate-950">
              {formatCurrency(Number(withdrawal.amount))}
            </h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              Request {withdrawal.id} · Created {withdrawal.createdAt.toLocaleString()}
            </p>
          </div>
          <span className="status-badge status-badge-neutral">
            {withdrawal.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Requester</h2>
            <Link
              href={`/users/${withdrawal.user.id}`}
              className="mt-4 block rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
            >
              <p className="font-medium text-slate-900">{withdrawal.user.name}</p>
              <p className="mt-1 text-sm text-slate-500">{withdrawal.user.email}</p>
            </Link>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Payout Details</h2>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              {bankInfo ? (
                <>
                  <p className="font-medium text-slate-900">
                    {bankInfo.accountHolderName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {bankInfo.bankName}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    {bankInfo.accountNumber}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No bank details were saved on the user profile.
                </p>
              )}
            </div>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Timeline</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Requested At</p>
                <p className="mt-1 font-medium text-slate-900">
                  {withdrawal.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Processed At</p>
                <p className="mt-1 font-medium text-slate-900">
                  {withdrawal.processedAt
                    ? withdrawal.processedAt.toLocaleString()
                    : "Awaiting action"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Available Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Move the request through approval and completion without leaving this record.
            </p>
            <div className="mt-4">
              <WithdrawalStatusActions
                id={withdrawal.id}
                status={withdrawal.status}
              />
            </div>
          </div>

          <AdminNotesPanel
            resourceType="WITHDRAWAL_REQUEST"
            resourceId={withdrawal.id}
            notes={adminNotes.map((note) => ({
              id: note.id,
              body: note.body,
              createdAt: note.createdAt.toISOString(),
              updatedAt: note.updatedAt.toISOString(),
              author: {
                id: note.author.id,
                email: note.author.email,
                role: note.author.role,
              },
            }))}
          />

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Audit Trail</h2>
            <div className="mt-4">
              <AuditLogFeed
                logs={auditLogs}
                emptyMessage="No audit records linked to this withdrawal yet."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
