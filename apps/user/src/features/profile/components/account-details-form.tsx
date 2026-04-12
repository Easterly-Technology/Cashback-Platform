"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type AccountDetailsFormProps = {
  initialUser: {
    name: string;
    email: string;
    phone: string;
  };
};

export function AccountDetailsForm({ initialUser }: AccountDetailsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email);
  const [phone, setPhone] = useState(initialUser.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/profile/account-details", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string | Record<string, unknown> }
      | null;

    if (!response.ok) {
      setError(
        typeof data?.error === "string"
          ? data.error
          : "Check the fields and try again",
      );
      setSaving(false);
      return;
    }

    setSuccess("Account details updated");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <p className="material-alert material-alert-danger text-sm">{error}</p>
      ) : null}
      {success ? (
        <p className="material-alert material-alert-info text-sm">{success}</p>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="Full name"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="name@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="px-4 py-3 text-sm"
          placeholder="Phone number"
          autoComplete="tel"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="material-button-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
