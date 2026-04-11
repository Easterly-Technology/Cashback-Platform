"use client";

import { useState } from "react";
import { SubPageHeader } from "../sub-page-header";

interface AddressFields {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const emptyAddress: AddressFields = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Malaysia",
};

function AddressForm({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  function update(field: keyof AddressFields, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSuccess("");

    // Placeholder: API call would go here
    setTimeout(() => {
      setSuccess("This feature is coming soon.");
      setSaving(false);
    }, 500);
  }

  return (
    <div className="material-card p-5">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>

      {success ? (
        <p className="mt-3 material-alert material-alert-info text-sm">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Address Line 1
          </label>
          <input
            type="text"
            value={address.line1}
            onChange={(e) => update("line1", e.target.value)}
            className="px-4 py-3 text-sm"
            placeholder="Street address"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Address Line 2
          </label>
          <input
            type="text"
            value={address.line2}
            onChange={(e) => update("line2", e.target.value)}
            className="px-4 py-3 text-sm"
            placeholder="Apartment, unit, etc. (optional)"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              City
            </label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => update("city", e.target.value)}
              className="px-4 py-3 text-sm"
              placeholder="City"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              State
            </label>
            <input
              type="text"
              value={address.state}
              onChange={(e) => update("state", e.target.value)}
              className="px-4 py-3 text-sm"
              placeholder="State"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Postal Code
            </label>
            <input
              type="text"
              value={address.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
              className="px-4 py-3 text-sm"
              placeholder="Postal code"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Country
            </label>
            <input
              type="text"
              value={address.country}
              onChange={(e) => update("country", e.target.value)}
              className="px-4 py-3 text-sm"
              placeholder="Country"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="material-button-primary w-full px-4 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Address"}
        </button>
      </form>
    </div>
  );
}

export default function AddressPage() {
  return (
    <div className="space-y-4">
      <SubPageHeader title="Address Setting" />

      <AddressForm
        title="Billing Address"
        description="Address used for invoices and payment records."
      />

      <AddressForm
        title="Shipping Address"
        description="Address used for physical deliveries."
      />
    </div>
  );
}
