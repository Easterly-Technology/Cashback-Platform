"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@cashback/shared/client";

interface GeneratedQr {
  qrCodeId: string;
  qrUrl: string;
  qrImageDataUrl: string;
  totalAmount: number;
  rebateAmount: number;
  serviceFee: number;
  expiresAt: string;
}

function parseAmount(value: string) {
  const trimmed = value.trim();

  if (!trimmed || !/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function TransactionQrForm({
  rebatePct,
  serviceFeePct,
}: {
  rebatePct: number;
  serviceFeePct: number;
}) {
  const [amount, setAmount] = useState("");
  const [generated, setGenerated] = useState<GeneratedQr | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const parsedAmount = useMemo(() => parseAmount(amount), [amount]);
  const previewRebate = parsedAmount ? parsedAmount * rebatePct : 0;
  const previewServiceFee = parsedAmount ? parsedAmount * serviceFeePct : 0;

  async function handleGenerate() {
    if (parsedAmount === null) {
      setError("Enter a valid transaction total with up to 2 decimal places.");
      return;
    }

    setSubmitting(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalAmount: parsedAmount }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Failed to generate QR code");
      }

      const data = (await response.json()) as GeneratedQr;
      setGenerated(data);
    } catch (generateError) {
      console.error(generateError);
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Failed to generate QR code",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyQrUrl() {
    if (!generated?.qrUrl || typeof navigator === "undefined") {
      return;
    }

    await navigator.clipboard.writeText(generated.qrUrl);
    setCopied(true);
  }

  function resetFlow(nextAmount: string) {
    setAmount(nextAmount);
    setGenerated(null);
    setCopied(false);
    setError("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="material-card p-6">
          <span className="material-chip">Counter Checkout</span>
          <h1 className="material-title mt-4 text-slate-950">New Transaction</h1>
          <p className="material-subtitle mt-3">
            Enter the final transaction total, generate a signed customer QR, and
            hand off confirmation without building a product cart.
          </p>
        </div>

        <div className="material-card-flat p-5">
          <p className="text-sm font-semibold text-slate-950">Amount Preview</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Transaction Total
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatCurrency(parsedAmount ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Estimated Rebate
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(previewRebate)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated Service Fee
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(previewServiceFee)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="material-alert material-alert-danger text-sm">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="space-y-4">
          <div className="material-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Enter Transaction Value
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Capture the full checkout amount exactly as charged to the customer.
                </p>
              </div>
              <span className="material-chip material-chip-muted">
                Up to 2 decimals
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Total Amount (RM)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => resetFlow(event.target.value)}
                  className="px-4 py-3 text-lg font-semibold"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  What the customer will confirm
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Merchant name, transaction total, QR status, and token entitlement
                  based on the entered amount.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={parsedAmount === null || submitting}
                className="material-button-primary min-h-11 w-full px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-50"
              >
                {submitting ? "Generating..." : "Generate QR Code"}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {generated ? (
            <div className="material-card-flat p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Ready to Scan</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Share this QR with the customer before it expires.
                  </p>
                </div>
                <span className="material-chip material-chip-muted">
                  Expires {new Date(generated.expiresAt).toLocaleTimeString()}
                </span>
              </div>

              <div className="mt-5 rounded-[28px] bg-white p-4 shadow-sm">
                {generated.qrImageDataUrl ? (
                  <img
                    src={generated.qrImageDataUrl}
                    alt="Transaction QR code"
                    className="mx-auto"
                  />
                ) : (
                  <div className="mx-auto h-[280px] w-[280px] animate-pulse rounded-2xl bg-slate-100" />
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Share Link
                </p>
                <p className="mt-2 break-all text-sm text-slate-700">
                  {generated.qrUrl}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.totalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rebate
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.rebateAmount)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Service Fee
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {formatCurrency(generated.serviceFee)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyQrUrl()}
                  className="material-button-primary min-h-11 px-4 py-2 text-sm font-semibold text-white"
                >
                  {copied ? "Copied" : "Copy Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenerated(null);
                    setCopied(false);
                  }}
                  className="material-button-outlined min-h-11 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Clear QR
                </button>
              </div>
            </div>
          ) : (
            <div className="material-empty px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-700">
                No QR generated yet.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Enter a transaction total to create the next customer QR.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
