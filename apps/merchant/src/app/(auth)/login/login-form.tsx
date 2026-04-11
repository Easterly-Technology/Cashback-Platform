"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm({
  authError,
  callbackUrl,
}: {
  authError: string | null;
  callbackUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] items-center py-6">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="merchant-auth-shell hidden p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-50">
              Merchant Access
            </span>
            <h1 className="merchant-page-title mt-6 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em]">
              Retail control built for checkout speed and daily store rhythm.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-emerald-50/82">
              Merchants can jump back into in-progress tasks, track settlement exposure, and keep stock ready without bouncing between disconnected tools.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="merchant-sidebar-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                Counter Workflow
              </p>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                Enter the final transaction value, generate a customer QR, and keep the checkout line moving during peak windows.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="merchant-sidebar-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                  Inventory
                </p>
                <p className="mt-2 text-sm text-emerald-50/78">
                  Spot low-stock items before they hurt conversion.
                </p>
              </div>
              <div className="merchant-sidebar-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                  Settlements
                </p>
                <p className="mt-2 text-sm text-emerald-50/78">
                  Watch fees and payout periods in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="merchant-auth-panel p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="material-chip">Merchant Portal</span>
              <h1 className="merchant-page-title mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {callbackUrl === "/"
                  ? "Continue to your dashboard and amount-based payment QR tools."
                  : `Continue to ${callbackUrl}.`}
              </p>
            </div>
            <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-right sm:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Demo
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                merchant1@cashback.dev
              </p>
            </div>
          </div>

          {authError ? (
            <p className="material-alert material-alert-warning mt-5 text-sm">
              Your session expired or access was interrupted. Sign in again to continue.
            </p>
          ) : null}

          <div className="material-alert material-alert-info mt-4 text-sm">
            Demo credentials: <span className="font-semibold">merchant1@cashback.dev</span> /{" "}
            <span className="font-semibold">merchant123</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/76 px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Checkout Flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Create payment QRs, watch confirmations, and keep the queue moving.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                Store Operations
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Monitor catalog health and settlement exposure from one hub.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error ? (
              <p className="material-alert material-alert-danger text-sm">{error}</p>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
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
              {loading ? "Signing in..." : "Open Merchant Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
