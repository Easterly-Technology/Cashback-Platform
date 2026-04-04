"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface ReceiptDetails {
  qrCodeId: string;
  status: string;
  expiresAt: string;
  merchant: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  tokensEntitled: number;
}

export default function ScanConfirmPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [details, setDetails] = useState<ReceiptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const qrCodeId = params.id;
  const signature = searchParams.get("sig");
  const callbackUrl = `/scan/${qrCodeId}${signature ? `?sig=${encodeURIComponent(signature)}` : ""}`;

  useEffect(() => {
    async function loadReceipt() {
      if (!signature) {
        setError("Missing QR signature");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/receipts/${qrCodeId}?sig=${signature}`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load receipt");
        setLoading(false);
        return;
      }

      setDetails(data);
      setLoading(false);
    }

    void loadReceipt();
  }, [qrCodeId, signature]);

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

  if (loading) {
    return (
      <div className="material-empty px-6 py-16 text-center text-sm text-slate-400">
        Loading transaction...
      </div>
    );
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
      <div className="material-card py-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
          Transaction Confirmed
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          RM{details.totalAmount.toFixed(2)} at {details.merchant}
        </p>
        <p className="mt-2 font-medium text-emerald-600">
          +{details.tokensEntitled.toLocaleString()} tokens entitled
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Tokens will start releasing tomorrow at midnight
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="material-button-primary px-5 py-2.5 text-sm font-semibold"
          >
            Back to Dashboard
          </button>
          <Link
            href="/tokens"
            className="material-button-outlined px-5 py-2.5 text-sm font-semibold"
          >
            View Tokens
          </Link>
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
          Check the merchant, line items, and token estimate below. When everything
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
        <p className="mb-3 text-sm text-slate-500">Items</p>
        {details.items.map((item) => (
          <div
            key={`${item.productId}-${item.name}`}
            className="flex justify-between gap-4 py-2 text-sm"
          >
            <span>
              {item.name} <span className="text-slate-400">× {item.quantity}</span>
            </span>
            <span className="font-medium text-slate-900">
              RM{item.lineTotal.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-950">
          <span>Total</span>
          <span>RM{details.totalAmount.toFixed(2)}</span>
        </div>
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
            : "Confirm & Upload"}
      </button>

      <p className="text-center text-xs text-slate-400">
        QR ID: {params.id}
      </p>
    </div>
  );
}
