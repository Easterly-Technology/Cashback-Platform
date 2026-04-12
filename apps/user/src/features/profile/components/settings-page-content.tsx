"use client";

import { useState } from "react";
import { SubPageHeader } from "@/features/profile/components/sub-page-header";

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

export function SettingsPageContent() {
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("MYR");
  const [success, setSuccess] = useState("");

  function handleSave() {
    setSuccess("This feature is coming soon.");
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-3 bg-[#0b0e11] pb-8 text-[#eaecef]">
      <SubPageHeader title="App Setting" />

      {success ? (
        <p className="material-alert material-alert-info text-sm">{success}</p>
      ) : null}

      <div className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <h2 className="text-sm font-bold text-white">Language</h2>
        <p className="mt-1 text-xs text-[#848e9c]">
          Choose your preferred display language.
        </p>
        <div className="mt-4 space-y-2">
          {languages.map((lang) => (
            <label
              key={lang.code}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-transparent px-4 py-3 transition-colors ${
                language === lang.code
                  ? "border-[#f0b90b]"
                  : "border-[#2b3139] hover:border-[#3c4450]"
              }`}
            >
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={language === lang.code}
                onChange={() => setLanguage(lang.code)}
                className="accent-[#f0b90b]"
              />
              <span
                className={`text-sm ${
                  language === lang.code
                    ? "font-semibold text-[#f0b90b]"
                    : "text-[#eaecef]"
                }`}
              >
                {lang.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#1e2329] bg-[#181a20] p-4">
        <h2 className="text-sm font-bold text-white">Currency</h2>
        <p className="mt-1 text-xs text-[#848e9c]">
          Choose your preferred display currency.
        </p>
        <div className="mt-4 space-y-2">
          {currencies.map((cur) => (
            <label
              key={cur.code}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-transparent px-4 py-3 transition-colors ${
                currency === cur.code
                  ? "border-[#f0b90b]"
                  : "border-[#2b3139] hover:border-[#3c4450]"
              }`}
            >
              <input
                type="radio"
                name="currency"
                value={cur.code}
                checked={currency === cur.code}
                onChange={() => setCurrency(cur.code)}
                className="accent-[#f0b90b]"
              />
              <span
                className={`text-sm ${
                  currency === cur.code
                    ? "font-semibold text-[#f0b90b]"
                    : "text-[#eaecef]"
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
        className="w-full rounded-lg bg-[#f0b90b] px-4 py-3 text-sm font-bold text-[#181a20] transition hover:bg-[#f8d33a]"
      >
        Save Preferences
      </button>
    </div>
  );
}
