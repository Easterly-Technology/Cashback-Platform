"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BankInfoInput } from "@cashback/shared/client";

export function BankInfoForm({
  initialBankInfo,
}: {
  initialBankInfo: BankInfoInput | null;
}) {
  const router = useRouter();
  const [accountHolderName, setAccountHolderName] = useState(
    initialBankInfo?.accountHolderName ?? "",
  );
  const [bankName, setBankName] = useState(initialBankInfo?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initialBankInfo?.accountNumber ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/profile/bank-info", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountHolderName,
        bankName,
        accountNumber,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(data?.error ?? "Failed to save payout details");
      setSaving(false);
      return;
    }

    setSuccess("Payout details saved");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="material-alert material-alert-danger text-sm">{error}</p>
      ) : null}
      {success ? (
        <p className="material-alert material-alert-info text-sm">{success}</p>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Account Holder Name
        </label>
        <input
          type="text"
          value={accountHolderName}
          onChange={(event) => setAccountHolderName(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="Full legal name"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Bank Name
        </label>
        <input
          type="text"
          value={bankName}
          onChange={(event) => setBankName(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="Your bank"
          autoComplete="organization"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Account Number
        </label>
        <input
          type="text"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="Account number"
          autoComplete="off"
          required
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="material-button-outlined w-full px-4 py-3 text-sm font-semibold text-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Payout Details"}
      </button>
    </form>
  );
}
