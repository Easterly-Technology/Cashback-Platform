"use client";

import { useRouter, useSearchParams } from "next/navigation";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "rewards", label: "Rewards" },
  { key: "wallet", label: "Wallet" },
] as const;

export type HomeTab = (typeof tabs)[number]["key"];

export function HomeTabBar({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <div className="sticky top-[60px] z-40 -mx-1 px-1">
      <div className="material-surface flex gap-1 overflow-x-auto rounded-[20px] px-1.5 py-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`shrink-0 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "material-button-tonal shadow-sm"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
