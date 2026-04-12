"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="w-full rounded-lg border border-[#f6465d]/40 bg-[#181a20] px-4 py-3 text-sm font-semibold text-[#f6465d] transition hover:bg-[#2d171f]"
    >
      Sign Out
    </button>
  );
}
