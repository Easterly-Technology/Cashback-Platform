import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";
import { AdminNotesPanel } from "@/components/admin-notes-panel";
import { AuditLogFeed } from "@/components/audit-log-feed";
import { EntityStatusActions } from "@/components/entity-status-actions";

export const dynamic = "force-dynamic";

function getTransactionActions(status: string) {
  switch (status) {
    case "PENDING":
      return [
        { value: "CONFIRMED", label: "Confirm", tone: "primary" as const },
        { value: "DISPUTED", label: "Flag Dispute", tone: "neutral" as const },
        { value: "CANCELLED", label: "Cancel", tone: "danger" as const },
      ];
    case "CONFIRMED":
      return [
        { value: "DISPUTED", label: "Mark Disputed", tone: "neutral" as const },
        { value: "CANCELLED", label: "Cancel", tone: "danger" as const },
      ];
    case "DISPUTED":
      return [
        { value: "CONFIRMED", label: "Resolve Dispute", tone: "primary" as const },
        { value: "CANCELLED", label: "Cancel", tone: "danger" as const },
      ];
    default:
      return [];
  }
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [transaction, auditLogs, adminNotes] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        merchant: { select: { id: true, name: true, contactEmail: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
        qrCode: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { resourceType: "TRANSACTION", resourceId: id },
          { resourceType: "TRANSACTION_QR", resourceId: id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.adminNote.findMany({
      where: {
        resourceType: "TRANSACTION",
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

  if (!transaction) notFound();

  const statusHistory = auditLogs.filter((log) =>
    log.action.includes("TRANSACTION_STATUS"),
  );

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="material-chip">Transaction Detail</span>
            <h1 className="material-title mt-4 text-slate-950">
              {formatCurrency(Number(transaction.totalAmount))}
            </h1>
            <p className="material-subtitle mt-3 max-w-2xl">
              Transaction {transaction.id} · Created {transaction.createdAt.toLocaleString()}
            </p>
          </div>
          <span className="status-badge status-badge-neutral">
            {transaction.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Amount</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transaction.totalAmount))}
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Rebate</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transaction.rebateAmount))}
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Service Fee</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {formatCurrency(Number(transaction.serviceFee))}
          </p>
        </div>
        <div className="material-stat p-5">
          <p className="text-sm font-medium text-slate-500">Confirmed At</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {transaction.confirmedAt
              ? transaction.confirmedAt.toLocaleString()
              : "Not confirmed"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Linked Records</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/users/${transaction.user.id}`}
                className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <p className="text-sm text-slate-500">User</p>
                <p className="mt-1 font-medium text-slate-900">
                  {transaction.user.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{transaction.user.email}</p>
              </Link>
              <Link
                href={`/merchants/${transaction.merchant.id}`}
                className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <p className="text-sm text-slate-500">Merchant</p>
                <p className="mt-1 font-medium text-slate-900">
                  {transaction.merchant.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {transaction.merchant.contactEmail}
                </p>
              </Link>
            </div>
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Line Items</h2>
            <div className="mt-4 space-y-3">
              {transaction.items.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No line items were attached to this transaction.
                </p>
              ) : (
                transaction.items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.product.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.product.category ?? "Uncategorized"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {formatCurrency(Number(item.lineTotal))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Admin Actions</h2>
            <p className="mt-2 text-sm text-slate-500">
              Confirm, dispute, or cancel the transaction directly from this page, then leave a note for the next operator if needed.
            </p>
            <div className="mt-4">
              <EntityStatusActions
                endpoint={`/api/admin/transactions/${transaction.id}`}
                currentStatus={transaction.status}
                options={getTransactionActions(transaction.status)}
                emptyLabel="No further actions available"
              />
            </div>
            {transaction.qrCode ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">QR Code Status</p>
                <p className="mt-1 font-medium text-slate-900">
                  {transaction.qrCode.status}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Created {transaction.qrCode.createdAt.toLocaleString()} · Expires{" "}
                  {transaction.qrCode.expiresAt.toLocaleString()}
                </p>
              </div>
            ) : null}
          </div>

          <div className="material-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Status History</h2>
            <div className="mt-4 space-y-3">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No admin status changes recorded yet.
                </p>
              ) : (
                statusHistory.map((log) => (
                  <div key={String(log.id)} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {log.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <AdminNotesPanel
            resourceType="TRANSACTION"
            resourceId={transaction.id}
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
                emptyMessage="No audit records linked to this transaction yet."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
