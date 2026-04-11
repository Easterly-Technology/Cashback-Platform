"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TokenSettingsForm({
  initialMultiplier,
  initialReleaseRate,
  initialMarketplaceEnabled,
}: {
  initialMultiplier: number;
  initialReleaseRate: number;
  initialMarketplaceEnabled: boolean;
}) {
  const [multiplier, setMultiplier] = useState(String(initialMultiplier));
  const [releaseRate, setReleaseRate] = useState(String(initialReleaseRate));
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(
    initialMarketplaceEnabled,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tokens/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          multiplier: Number(multiplier),
          releaseRate: Number(releaseRate),
          marketplaceEnabled,
        }),
      });
      if (res.ok) {
        setMessage("Settings saved successfully");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(data?.error ?? "Failed to save settings");
      }
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-4">Token Settings</h2>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Token Multiplier
          </label>
          <input
            type="number"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            step="0.1"
            min="1"
          />
          <p className="text-xs text-gray-400 mt-1">
            Entitled = Spending x {multiplier}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Daily Release Rate (%)
          </label>
          <input
            type="number"
            value={releaseRate}
            onChange={(e) => setReleaseRate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            step="0.1"
            min="0.1"
            max="100"
          />
          <p className="text-xs text-gray-400 mt-1">
            {Number(releaseRate) > 0
              ? `${Math.ceil(100 / Number(releaseRate))} days to full release`
              : "Enter a release rate above 0"}
          </p>
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={marketplaceEnabled}
              onChange={(e) => setMarketplaceEnabled(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Exchange Enabled
            </span>
          </label>
        </div>
        <div className="col-span-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
