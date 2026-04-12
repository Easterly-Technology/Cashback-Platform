import type { SVGProps } from "react";

export function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M6.5 9.5v10h11v-10" />
      <path d="M10 19.5v-5h4v5" />
    </IconBase>
  );
}

export function DiscoverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 8.5h16" />
      <path d="m6 8.5 1.2-3h9.6l1.2 3" />
      <path d="M5.5 8.5v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9" />
      <path d="M9 12.5h6" />
    </IconBase>
  );
}

export function TradeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 7.5h10" />
      <path d="m14 4.5 3 3-3 3" />
      <path d="M17 16.5H7" />
      <path d="m10 13.5-3 3 3 3" />
    </IconBase>
  );
}

export function TokensIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9.5 10.5c0-1.1 1-2 2.5-2s2.5.7 2.5 1.8c0 2.8-5 1.1-5 3.9 0 1.1 1.1 1.8 2.5 1.8 1.7 0 2.7-.9 2.7-2" />
    </IconBase>
  );
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.49-6.01" />
      <path d="M3.5 5.5v4h4" />
      <path d="M12 7.5v5l3.25 2" />
    </IconBase>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8.5" r="3.25" />
      <path d="M5.5 19c1.2-2.6 3.6-4 6.5-4s5.3 1.4 6.5 4" />
    </IconBase>
  );
}

export function ScanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M5 8V6a1 1 0 0 1 1-1h2" />
      <path d="M19 8V6a1 1 0 0 0-1-1h-2" />
      <path d="M5 16v2a1 1 0 0 0 1 1h2" />
      <path d="M19 16v2a1 1 0 0 1-1 1h-2" />
      <path d="M7 12h10" />
      <path d="M9 9.5h6" />
      <path d="M9 14.5h6" />
    </IconBase>
  );
}
