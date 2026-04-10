import Link from "next/link";
import { prisma } from "@cashback/database";
import { formatCurrency } from "@cashback/shared";

export const dynamic = "force-dynamic";

const USER_STATUS_VALUES = ["ACTIVE", "SUSPENDED", "BANNED"] as const;
const MERCHANT_STATUS_VALUES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
const TRANSACTION_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "DISPUTED",
  "CANCELLED",
] as const;
const WITHDRAWAL_STATUS_VALUES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const normalized = query.toUpperCase();

  const isUserStatus = USER_STATUS_VALUES.includes(
    normalized as (typeof USER_STATUS_VALUES)[number],
  );
  const isMerchantStatus = MERCHANT_STATUS_VALUES.includes(
    normalized as (typeof MERCHANT_STATUS_VALUES)[number],
  );
  const isTransactionStatus = TRANSACTION_STATUS_VALUES.includes(
    normalized as (typeof TRANSACTION_STATUS_VALUES)[number],
  );
  const isWithdrawalStatus = WITHDRAWAL_STATUS_VALUES.includes(
    normalized as (typeof WITHDRAWAL_STATUS_VALUES)[number],
  );

  const uuidQuery = isUuid(query);
  let users: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  let merchants: Awaited<ReturnType<typeof prisma.merchant.findMany>> = [];
  let transactions: Awaited<
    ReturnType<
      typeof prisma.transaction.findMany<{
        include: {
          user: { select: { email: true } };
          merchant: { select: { name: true } };
        };
      }>
    >
  > = [];
  let withdrawals: Awaited<
    ReturnType<
      typeof prisma.withdrawalRequest.findMany<{
        include: {
          user: { select: { name: true; email: true } };
        };
      }>
    >
  > = [];

  if (query) {
    [users, merchants, transactions, withdrawals] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            ...(uuidQuery ? [{ id: query }] : []),
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            ...(isUserStatus ? [{ status: normalized as "ACTIVE" }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.merchant.findMany({
        where: {
          OR: [
            ...(uuidQuery ? [{ id: query }] : []),
            { name: { contains: query, mode: "insensitive" } },
            { contactEmail: { contains: query, mode: "insensitive" } },
            ...(isMerchantStatus ? [{ status: normalized as "ACTIVE" }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.transaction.findMany({
        where: {
          OR: [
            ...(uuidQuery ? [{ id: query }] : []),
            ...(isTransactionStatus
              ? [{ status: normalized as "PENDING" }]
              : []),
            { user: { email: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { merchant: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          user: { select: { email: true } },
          merchant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.withdrawalRequest.findMany({
        where: {
          OR: [
            ...(uuidQuery ? [{ id: query }] : []),
            ...(isWithdrawalStatus
              ? [{ status: normalized as "PENDING" }]
              : []),
            { user: { email: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);
  }

  const totalResults =
    users.length + merchants.length + transactions.length + withdrawals.length;

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <span className="material-chip">Global Search</span>
        <h1 className="material-title mt-4 text-slate-950">Search</h1>
        <p className="material-subtitle mt-3 max-w-2xl">
          Search users, merchants, transactions, and withdrawals by name, email, id, or status.
        </p>
      </div>

      {!query ? (
        <div className="material-empty px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-700">
            Enter a search term from the top bar.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Try a person name, email, UUID fragment, or status like `PENDING`.
          </p>
        </div>
      ) : (
        <>
          <div className="material-card p-5">
            <p className="text-sm text-slate-500">
              Showing {totalResults.toLocaleString()} result
              {totalResults === 1 ? "" : "s"} for{" "}
              <span className="font-semibold text-slate-950">{query}</span>.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="material-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Users</h2>
                <span className="material-chip material-chip-muted">
                  {users.length}
                </span>
              </div>
              <div className="space-y-3">
                {users.length === 0 ? (
                  <p className="text-sm text-slate-500">No user matches.</p>
                ) : (
                  users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.id}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-950">{user.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {user.status} · {user.id}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="material-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Merchants</h2>
                <span className="material-chip material-chip-muted">
                  {merchants.length}
                </span>
              </div>
              <div className="space-y-3">
                {merchants.length === 0 ? (
                  <p className="text-sm text-slate-500">No merchant matches.</p>
                ) : (
                  merchants.map((merchant) => (
                    <Link
                      key={merchant.id}
                      href={`/merchants/${merchant.id}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-950">{merchant.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {merchant.contactEmail}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {merchant.status} · {merchant.id}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="material-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">
                  Transactions
                </h2>
                <span className="material-chip material-chip-muted">
                  {transactions.length}
                </span>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No transaction matches.
                  </p>
                ) : (
                  transactions.map((transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/transactions/${transaction.id}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">
                            {transaction.merchant.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {transaction.user.email}
                          </p>
                        </div>
                        <span className="status-badge status-badge-neutral">
                          {transaction.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">
                        {formatCurrency(Number(transaction.totalAmount))}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.id}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="material-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">
                  Withdrawals
                </h2>
                <span className="material-chip material-chip-muted">
                  {withdrawals.length}
                </span>
              </div>
              <div className="space-y-3">
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No withdrawal matches.
                  </p>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <Link
                      key={withdrawal.id}
                      href={`/withdrawals/${withdrawal.id}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-950">
                            {withdrawal.user.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {withdrawal.user.email}
                          </p>
                        </div>
                        <span className="status-badge status-badge-neutral">
                          {withdrawal.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">
                        {formatCurrency(Number(withdrawal.amount))}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {withdrawal.id}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
