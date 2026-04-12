import { SubPageHeader } from "@/features/profile/components/sub-page-header";

const policyItems = [
  {
    title: "Terms of Service",
    description: "Rules and conditions for using the platform.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M12 2 3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Refund Policy",
    description: "Guidelines on refunds and cancellations.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: "Token Usage Agreement",
    description: "Terms governing token entitlement and trade.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M9.5 10.5c0-1.1 1-2 2.5-2s2.5.7 2.5 1.8c0 2.8-5 1.1-5 3.9 0 1.1 1.1 1.8 2.5 1.8 1.7 0 2.7-.9 2.7-2" />
      </svg>
    ),
  },
];

export function PolicyPageContent() {
  return (
    <div className="space-y-4">
      <SubPageHeader title="Policy" />

      <div className="material-card overflow-hidden">
        <div className="divide-y divide-slate-100/70">
          {policyItems.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.description}
                </p>
              </div>
              <span className="material-chip">Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
