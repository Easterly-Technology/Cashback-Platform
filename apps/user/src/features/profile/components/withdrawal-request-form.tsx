"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, type BankInfoInput } from "@cashback/shared/client";

export function WithdrawalRequestForm({
  availableToWithdraw,
  bankInfo,
}: {
  availableToWithdraw: number;
  bankInfo: BankInfoInput | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const amountValue = Number(amount || 0);
  const hasBankInfo = Boolean(bankInfo);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/withdrawals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountValue,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(data?.error ?? "Failed to create withdrawal request");
      setSubmitting(false);
      return;
    }

    setSuccess("Withdrawal request submitted for review");
    setAmount("");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!hasBankInfo ? (
        <p className="material-alert material-alert-warning text-sm">
          Save your payout details first before requesting a withdrawal.{" "}
          <Link
            href="/profile/withdrawal#payout-details"
            className="font-semibold underline"
          >
            Add payout details
          </Link>
        </p>
      ) : null}

      {bankInfo ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Payout Account
          </p>
          <p className="mt-2 font-semibold text-slate-900">
            {bankInfo.accountHolderName}
          </p>
          <p className="mt-1 text-slate-600">{bankInfo.bankName}</p>
          <p className="mt-1 font-mono text-slate-500">
            {bankInfo.accountNumber}
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="material-alert material-alert-danger text-sm">{error}</p>
      ) : null}
      {success ? (
        <p className="material-alert material-alert-info text-sm">{success}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Withdrawal Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="px-4 py-3 text-sm"
            min="0.01"
            max={availableToWithdraw}
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Available now: {formatCurrency(availableToWithdraw)}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            !hasBankInfo ||
            submitting ||
            amountValue <= 0 ||
            amountValue > availableToWithdraw
          }
          aria-busy={submitting}
          className="material-button-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Request Withdrawal"}
        </button>
      </form>
    </div>
  );
}
