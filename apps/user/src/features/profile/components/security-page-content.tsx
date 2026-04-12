"use client";

import { useState } from "react";
import { SubPageHeader } from "@/features/profile/components/sub-page-header";

function PasswordSection({
  title,
  description,
  currentLabel,
  newLabel,
  confirmLabel,
}: {
  title: string;
  description: string;
  currentLabel: string;
  newLabel: string;
  confirmLabel: string;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (next.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    // Placeholder: API call would go here
    setTimeout(() => {
      setSuccess("This feature is coming soon.");
      setSaving(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    }, 500);
  }

  return (
    <div className="material-card p-5">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      {error ? (
        <p className="mt-3 material-alert material-alert-danger text-sm">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 material-alert material-alert-info text-sm">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {currentLabel}
          </label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="px-4 py-3 text-sm"
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {newLabel}
          </label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="px-4 py-3 text-sm"
            placeholder="Enter new password"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {confirmLabel}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="px-4 py-3 text-sm"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="material-button-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export function SecurityPageContent() {
  return (
    <div className="space-y-4">
      <SubPageHeader title="Account Security" />

      <PasswordSection
        title="Login Password"
        description="Change the password you use to sign in to your account."
        currentLabel="Current Login Password"
        newLabel="New Login Password"
        confirmLabel="Confirm Login Password"
      />

      <PasswordSection
        title="Transaction Password"
        description="Set a separate password required for withdrawals and trades."
        currentLabel="Current Transaction Password"
        newLabel="New Transaction Password"
        confirmLabel="Confirm Transaction Password"
      />
    </div>
  );
}
