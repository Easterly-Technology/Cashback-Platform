"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReceiptDetails } from "@/lib/receipt-details";

export function ScanConfirmClient({
  callbackUrl,
  details: initialDetails,
  initialError,
  qrCodeId,
  signature,
}: {
  callbackUrl: string;
  details: ReceiptDetails | null;
  initialError: string;
  qrCodeId: string;
  signature: string | null;
}) {
  const router = useRouter();
  const [details, setDetails] = useState(initialDetails);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleConfirm() {
    if (!signature || !details) return;

    setConfirming(true);
    setError("");

    const res = await fetch("/api/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCodeId: details.qrCodeId, signature }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setError("Please sign in before confirming this transaction.");
      } else {
        setError(data.error ?? "Failed to confirm transaction");
      }
      setConfirming(false);
      return;
    }

    setDetails((prev) =>
      prev ? { ...prev, status: "CONFIRMED", tokensEntitled: data.tokensEntitled } : prev,
    );
    setConfirmed(true);
    setConfirming(false);
  }

  if (error && !details) {
    return (
      <div className="material-card-flat py-8 text-center">
        <h1 className="text-xl font-bold text-slate-950">Unable to Load QR</h1>
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!details) return null;

  if (confirmed) {
    return (
      <div className="space-y-4 py-4">
        <div className="material-card py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
            Purchase Confirmed
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {details.merchant} • RM{details.totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="material-card-flat p-5">
          <span className="material-chip">What Happens Next</span>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Purchase Recorded
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Your receipt is now in transaction history.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
                Token Entitlement
              </p>
              <p className="mt-2 text-lg font-bold text-emerald-700">
                +{details.tokensEntitled.toLocaleString()} tokens
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-blue-700">
                Release Timing
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-800">
                Daily release starts tomorrow at midnight.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You can track this purchase from your dashboard, then follow released
            tokens in your Wallet until they are ready to trade.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/")}
              className="material-button-primary px-5 py-2.5 text-sm font-semibold"
            >
              Back to Dashboard
            </button>
            <Link
              href="/wallet"
              className="material-button-outlined px-5 py-2.5 text-sm font-semibold"
            >
              View Wallet
            </Link>
            <Link
              href="/wallet/history"
              className="material-button-outlined px-5 py-2.5 text-sm font-semibold"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(details.expiresAt) < new Date();
  const isUnavailable = details.status !== "PENDING" || isExpired;

  return (
    <div className="space-y-4 py-4">
      <div className="material-card p-6">
        <span className="material-chip">Confirm Purchase</span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
          Review your transaction before confirming
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Check the merchant, total amount, and token estimate below. When everything
          looks right, confirm once to add the purchase to your cashback history.
        </p>
      </div>

      {error ? (
        <div className="material-alert material-alert-danger text-sm">
          {error}{" "}
          {error.includes("sign in") ? (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-semibold underline"
            >
              Go to login
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="material-card-flat p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Merchant</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{details.merchant}</p>
          </div>
          <span
            className={`status-badge ${
              isUnavailable
                ? isExpired
                  ? "status-badge-danger"
                  : "status-badge-warning"
                : "status-badge-success"
            }`}
          >
            {isUnavailable ? (isExpired ? "Expired" : details.status) : "Ready"}
          </span>
        </div>
      </div>

      <div className="material-card-flat p-5">
        <p className="text-sm text-slate-500">Transaction Total</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          RM{details.totalAmount.toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This QR represents the full checkout amount entered by the merchant.
        </p>
      </div>

      <div className="material-alert material-alert-info">
        <p className="text-sm leading-6">
          You will receive <strong>{details.tokensEntitled.toLocaleString()} tokens</strong> (spending × 2).
          Tokens release daily at 0.5% starting tomorrow.
        </p>
      </div>

      <button
        onClick={() => void handleConfirm()}
        disabled={confirming || isUnavailable}
        className="material-button-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
      >
        {isUnavailable
          ? isExpired
            ? "QR Code Expired"
            : `QR ${details.status}`
          : confirming
            ? "Confirming..."
            : "Confirm Purchase"}
      </button>

      <p className="text-center text-xs text-slate-400">
        QR ID: {qrCodeId}
      </p>
    </div>
  );
}
