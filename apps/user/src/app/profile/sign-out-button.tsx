"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="w-full bg-red-50 text-red-600 py-2 rounded-xl text-sm border border-red-200"
    >
      Sign Out
    </button>
  );
}
