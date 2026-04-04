"use client";

import { useEffect, useState } from "react";

interface Setting {
  key: string;
  value: any;
  description: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(key);
    setMessage(null);
    try {
      let parsedValue: any = value;
      if (value === "true" || value === "false") {
        parsedValue = value === "true";
      } else if (!isNaN(Number(value)) && value.trim() !== "") {
        parsedValue = Number(value);
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: parsedValue }),
      });
      if (res.ok) {
        setMessage(`Saved "${key}" successfully`);
      } else {
        setMessage(`Failed to save "${key}"`);
      }
    } catch {
      setMessage(`Failed to save "${key}"`);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    setMessage(null);
    for (const s of settings) {
      await handleSave(s.key, String(s.value));
    }
    setMessage("All settings saved");
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>
        <p className="text-gray-400 text-sm">Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Platform Settings</h1>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border p-6">
        {settings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No settings found
          </p>
        ) : (
          <div className="space-y-4">
            {settings.map((s, i) => (
              <div
                key={s.key}
                className="flex flex-col gap-3 pb-4 border-b last:border-0 md:flex-row md:items-start"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 font-mono">
                    {s.key}
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.description ?? ""}
                  </p>
                </div>
                <input
                  value={String(s.value)}
                  onChange={(e) => {
                    const updated = [...settings];
                    updated[i] = { ...s, value: e.target.value };
                    setSettings(updated);
                  }}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm font-mono md:w-48"
                />
                <button
                  onClick={() => handleSave(s.key, String(s.value))}
                  disabled={saving === s.key}
                  className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                >
                  {saving === s.key ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleSaveAll}
          disabled={saving !== null}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Save All Settings
        </button>
      </div>
    </div>
  );
}
