"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  audience: "ALL_USERS" | "ACTIVE_USERS" | "MERCHANTS";
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
};

type AnnouncementDraft = {
  title: string;
  body: string;
  audience: AnnouncementRecord["audience"];
  isPinned: boolean;
  publishAt: string;
};

function toDatetimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getAnnouncementStateLabel(announcement: AnnouncementRecord) {
  if (
    announcement.status === "PUBLISHED" &&
    announcement.publishedAt &&
    new Date(announcement.publishedAt).getTime() > Date.now()
  ) {
    return "SCHEDULED";
  }

  return announcement.status;
}

export default function AnnouncementManager({
  initialAnnouncements,
  canManage,
}: {
  initialAnnouncements: AnnouncementRecord[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] =
    useState<AnnouncementRecord["audience"]>("ALL_USERS");
  const [isPinned, setIsPinned] = useState(false);
  const [publishAt, setPublishAt] = useState("");
  const [saving, setSaving] = useState<null | "draft" | "publish">(null);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AnnouncementDraft>>(() =>
    Object.fromEntries(
      initialAnnouncements.map((announcement) => [
        announcement.id,
        {
          title: announcement.title,
          body: announcement.body,
          audience: announcement.audience,
          isPinned: announcement.isPinned,
          publishAt: toDatetimeLocalValue(announcement.publishedAt),
        },
      ]),
    ),
  );

  const allSelected = useMemo(
    () =>
      initialAnnouncements.length > 0 &&
      selectedIds.length === initialAnnouncements.length,
    [initialAnnouncements.length, selectedIds.length],
  );

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  async function createAnnouncement(publishNow: boolean) {
    setSaving(publishNow ? "publish" : "draft");
    setMessage(null);

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          audience,
          isPinned,
          publishNow,
          publishAt: publishAt || null,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to save announcement");
        setSaving(null);
        return;
      }

      setTitle("");
      setBody("");
      setAudience("ALL_USERS");
      setIsPinned(false);
      setPublishAt("");
      setSaving(null);
      setMessage(
        publishNow
          ? "Announcement published"
          : data?.error
            ? data.error
            : "Announcement saved",
      );
      router.refresh();
    } catch {
      setSaving(null);
      setMessage("Failed to save announcement");
    }
  }

  async function updateAnnouncement(id: string, payload: Record<string, unknown>) {
    setUpdatingId(id);
    setMessage(null);

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Failed to update announcement");
        setUpdatingId(null);
        return;
      }

      setUpdatingId(null);
      setMessage("Announcement updated");
      router.refresh();
    } catch {
      setUpdatingId(null);
      setMessage("Failed to update announcement");
    }
  }

  async function applyBulkAction(action: string) {
    if (selectedIds.length === 0) {
      setMessage("Select at least one announcement first.");
      return;
    }

    setBulkAction(action);
    setMessage(null);

    try {
      const response = await fetch("/api/announcements/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds, action }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; updatedCount?: number }
        | null;

      if (!response.ok) {
        setMessage(data?.error ?? "Bulk action failed");
        setBulkAction(null);
        return;
      }

      setSelectedIds([]);
      setBulkAction(null);
      setMessage(`${data?.updatedCount ?? 0} announcement(s) updated`);
      router.refresh();
    } catch {
      setBulkAction(null);
      setMessage("Bulk action failed");
    }
  }

  if (!canManage) {
    return (
      <div className="material-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">Announcement History</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your role can review announcements, but publishing and editing broadcasts is limited to super admins.
        </p>

        <div className="mt-6 space-y-3">
          {initialAnnouncements.map((announcement) => (
            <div key={announcement.id} className="material-card-flat p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-slate-950">
                  {announcement.title}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {getAnnouncementStateLabel(announcement)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {announcement.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="material-card p-6">
        <h2 className="text-lg font-semibold text-slate-950">New Announcement</h2>
        <p className="mt-1 text-sm text-slate-500">
          Draft, publish immediately, or schedule a broadcast for later.
        </p>

        {message ? (
          <div className="mt-4 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {message}
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Announcement title"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write the announcement body..."
            className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as AnnouncementRecord["audience"])
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            >
              <option value="ALL_USERS">All Users</option>
              <option value="ACTIVE_USERS">Active Users</option>
            </select>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(event) => setPublishAt(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(event) => setIsPinned(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Pin announcement
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void createAnnouncement(false)}
              disabled={saving !== null}
              className="material-button-tonal px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
            >
              {saving === "draft" ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => void createAnnouncement(true)}
              disabled={saving !== null}
              className="material-button-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving === "publish" ? "Publishing..." : "Publish Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="material-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Announcement History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Drafts stay hidden until published. Scheduled items publish when their publish time arrives.
            </p>
          </div>
          <span className="material-chip material-chip-muted">
            {initialAnnouncements.length.toLocaleString()} items
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">
            {selectedIds.length.toLocaleString()} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {["publish", "archive", "restore", "pin", "unpin"].map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => void applyBulkAction(action)}
                disabled={bulkAction !== null}
                className="material-button-outlined px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                {bulkAction === action
                  ? "Working..."
                  : action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {initialAnnouncements.length === 0 ? (
          <div className="material-empty px-6 py-10 text-center">
            <p className="text-base font-medium text-slate-700">
              No announcements created yet.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Start with a draft or publish the first broadcast from this page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {initialAnnouncements.map((announcement) => {
              const draft = drafts[announcement.id];

              return (
                <div key={announcement.id} className="material-card-flat p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(announcement.id)}
                        onChange={() => toggleSelection(announcement.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {getAnnouncementStateLabel(announcement)}
                          </span>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                            {announcement.audience.replaceAll("_", " ")}
                          </span>
                          {announcement.isPinned ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              PINNED
                            </span>
                          ) : null}
                        </div>

                        <input
                          value={draft.title}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [announcement.id]: {
                                ...current[announcement.id],
                                title: event.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900"
                        />
                        <textarea
                          value={draft.body}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [announcement.id]: {
                                ...current[announcement.id],
                                body: event.target.value,
                              },
                            }))
                          }
                          className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600"
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                          <select
                            value={draft.audience}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [announcement.id]: {
                                  ...current[announcement.id],
                                  audience: event.target.value as AnnouncementRecord["audience"],
                                },
                              }))
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          >
                            <option value="ALL_USERS">All Users</option>
                            <option value="ACTIVE_USERS">Active Users</option>
                          </select>
                          <input
                            type="datetime-local"
                            value={draft.publishAt}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [announcement.id]: {
                                  ...current[announcement.id],
                                  publishAt: event.target.value,
                                },
                              }))
                            }
                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                          />
                          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={draft.isPinned}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [announcement.id]: {
                                    ...current[announcement.id],
                                    isPinned: event.target.checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            Pin announcement
                          </label>
                        </div>

                        <p className="text-xs text-slate-400">
                          Created {new Date(announcement.createdAt).toLocaleString()}
                          {announcement.publishedAt
                            ? ` · Publish time ${new Date(announcement.publishedAt).toLocaleString()}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void updateAnnouncement(announcement.id, {
                            title: draft.title,
                            body: draft.body,
                            audience: draft.audience,
                            isPinned: draft.isPinned,
                            publishAt: draft.publishAt || null,
                          })
                        }
                        disabled={updatingId !== null}
                        className="material-button-tonal px-3 py-2 text-xs font-semibold text-indigo-700 disabled:opacity-50"
                      >
                        {updatingId === announcement.id ? "Saving..." : "Save"}
                      </button>
                      {announcement.status !== "PUBLISHED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void updateAnnouncement(announcement.id, {
                              status: "PUBLISHED",
                              publishNow: true,
                            })
                          }
                          disabled={updatingId !== null}
                          className="material-button-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {updatingId === announcement.id ? "Updating..." : "Publish"}
                        </button>
                      ) : null}
                      {announcement.status !== "ARCHIVED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void updateAnnouncement(announcement.id, {
                              status: "ARCHIVED",
                            })
                          }
                          disabled={updatingId !== null}
                          className="material-button-outlined px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
                        >
                          {updatingId === announcement.id ? "Updating..." : "Archive"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void updateAnnouncement(announcement.id, {
                              status: "DRAFT",
                            })
                          }
                          disabled={updatingId !== null}
                          className="material-button-outlined px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          {updatingId === announcement.id ? "Updating..." : "Restore"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
