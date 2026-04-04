"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
          <span className="material-chip w-fit">Welcome Back</span>
          <h1 className="material-title mt-5 max-w-lg text-slate-950">
            Continue earning, releasing, and trading cashback rewards in one place.
          </h1>
          <p className="material-subtitle mt-4 max-w-xl">
            Sign in to check your balances, browse the marketplace, and use the exchange with a cleaner app-first experience.
          </p>
        </div>

        <div className="material-card p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Sign In</h1>
          <p className="mt-2 text-sm text-slate-500">
            {callbackUrl === "/"
              ? "Use your cashback account to enter the app."
              : `Sign in to continue to ${callbackUrl}.`}
          </p>

          {authError ? (
            <p className="material-alert material-alert-warning mt-4 text-sm">
              Your session expired or access was interrupted. Sign in again to continue.
            </p>
          ) : null}

          {error ? (
            <p className="material-alert material-alert-danger mt-4 text-sm">
              {error}
            </p>
          ) : null}

          <div className="material-alert material-alert-info mt-4 text-sm">
            Demo credentials: <span className="font-semibold">user1@cashback.dev</span> / <span className="font-semibold">user123</span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 text-sm"
                placeholder="user1@cashback.dev"
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

          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
