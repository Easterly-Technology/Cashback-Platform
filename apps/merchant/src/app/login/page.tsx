"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestedPath = searchParams.get("callbackUrl");
  const callbackUrl =
    requestedPath && requestedPath.startsWith("/") ? requestedPath : "/";
  const authError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push(result?.url ?? callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] items-center py-6">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:flex lg:flex-col lg:justify-center">
          <span className="material-chip w-fit">Merchant Access</span>
          <h1 className="material-title mt-5 max-w-lg text-slate-950">
            Reopen product, transaction, and settlement work exactly where you left it.
          </h1>
          <p className="material-subtitle mt-4 max-w-xl">
            We keep the callback path so a login prompt never resets your in-progress workflow.
          </p>
          <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Checkout Flow
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Jump back into QR generation and live transaction history.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Store Operations
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Monitor catalog health and settlement exposure from one place.
              </p>
            </div>
          </div>
        </div>

        <div className="material-card p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Merchant Portal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {callbackUrl === "/"
              ? "Sign in to continue to your dashboard."
              : `Sign in to continue to ${callbackUrl}.`}
          </p>

          {authError ? (
            <p className="material-alert material-alert-warning mt-4 text-sm">
              Your session expired or access was interrupted. Sign in again to continue.
            </p>
          ) : null}

          <div className="material-alert material-alert-info mt-4 text-sm">
            Demo credentials: <span className="font-semibold">merchant1@cashback.dev</span> / <span className="font-semibold">merchant123</span>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            Merchant access includes product management, QR sale generation, recent transactions, and settlement tracking.
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="material-alert material-alert-danger text-sm">
                {error}
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 text-sm"
                placeholder="merchant1@cashback.dev"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 text-sm"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="material-button-primary min-h-12 w-full px-4 py-3 text-sm font-semibold transition hover:translate-y-[-1px] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
