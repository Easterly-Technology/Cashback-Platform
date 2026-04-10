"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminNoteRecord = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string | null;
    role: string;
  };
};

export function AdminNotesPanel({
  resourceType,
  resourceId,
  notes,
}: {
  resourceType:
    | "USER"
    | "MERCHANT"
    | "TRANSACTION"
    | "WITHDRAWAL_REQUEST"
    | "ANNOUNCEMENT"
    | "SETTLEMENT";
  resourceId: string;
  notes: AdminNoteRecord[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitNote() {
    if (!body.trim()) {
      setMessage("Write a note before saving.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceType,
          resourceId,
          body,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to save note");
        setSubmitting(false);
        return;
      }

      setBody("");
      setSubmitting(false);
      setMessage("Internal note saved");
      router.refresh();
    } catch {
      setSubmitting(false);
      setMessage("Failed to save note");
    }
  }

  return (
    <div className="material-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Internal Notes</h2>
          <p className="mt-1 text-sm text-slate-500">
            Private handoff notes for the admin team.
          </p>
        </div>
        <span className="material-chip material-chip-muted">
          {notes.length.toLocaleString()} notes
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Leave context for the next admin..."
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Notes are only visible inside the admin app.
          </p>
          <button
            type="button"
            onClick={() => void submitNote()}
            disabled={submitting}
            className="material-button-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Add Note"}
          </button>
        </div>
        {message ? <p className="text-sm text-slate-500">{message}</p> : null}
      </div>

      <div className="mt-5 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No internal notes yet.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-slate-200 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {note.author.role.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{note.body}</p>
              <p className="mt-3 text-xs text-slate-400">
                {note.author.email ?? "Unknown admin"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
