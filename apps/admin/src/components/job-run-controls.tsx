"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobRunControls({
  jobName,
  disabled,
}: {
  jobName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runJob() {
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/jobs/${jobName}`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to run job");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setMessage("Job started successfully");
      router.refresh();
    } catch {
      setSubmitting(false);
      setMessage("Failed to run job");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void runJob()}
        disabled={disabled || submitting}
        className="material-button-tonal px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Running..." : "Run Now"}
      </button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
