"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="material-button-outlined w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
    >
      Sign Out
    </button>
  );
}
