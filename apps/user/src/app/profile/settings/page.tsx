"use client";

import { useState } from "react";
import { SubPageHeader } from "../sub-page-header";

const languages = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "中文 (Chinese)" },
];

const currencies = [
  { code: "MYR", label: "RM - Malaysian Ringgit" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "SGD", label: "SGD - Singapore Dollar" },
];

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("MYR");
  const [success, setSuccess] = useState("");

  function handleSave() {
    setSuccess("This feature is coming soon.");
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="space-y-4">
      <SubPageHeader title="App Setting" />

      {success ? (
        <p className="material-alert material-alert-info text-sm">{success}</p>
      ) : null}

      {/* Language */}
      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">Language</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose your preferred display language.
        </p>
        <div className="mt-4 space-y-2">
          {languages.map((lang) => (
            <label
              key={lang.code}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                language === lang.code
                  ? "border-blue-300 bg-blue-50/60"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={language === lang.code}
                onChange={() => setLanguage(lang.code)}
                className="accent-blue-600"
              />
              <span
                className={`text-sm ${
                  language === lang.code
                    ? "font-semibold text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {lang.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="material-card p-5">
        <h2 className="text-sm font-semibold text-slate-950">Currency</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose your preferred display currency.
        </p>
        <div className="mt-4 space-y-2">
          {currencies.map((cur) => (
            <label
              key={cur.code}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                currency === cur.code
                  ? "border-blue-300 bg-blue-50/60"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="currency"
                value={cur.code}
                checked={currency === cur.code}
                onChange={() => setCurrency(cur.code)}
                className="accent-blue-600"
              />
              <span
                className={`text-sm ${
                  currency === cur.code
                    ? "font-semibold text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {cur.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="material-button-primary w-full px-4 py-3 text-sm font-semibold"
      >
        Save Preferences
      </button>
    </div>
  );
}
