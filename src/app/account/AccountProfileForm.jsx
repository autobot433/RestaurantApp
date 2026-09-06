"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cleanString, optionalPhone, ValidationError } from "@/lib/security/validators";

export default function AccountProfileForm({ initial }) {
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const name = cleanString(fullName, { max: 120, field: "name" });
      optionalPhone(phone); // validate client-side too
      setLoading(true);
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err instanceof ValidationError ? err.message : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+14155552671"
          autoComplete="tel"
        />
      </div>
      <button className="btn btn-gold" disabled={loading}>
        {loading ? <span className="spinner" /> : "Save changes"}
      </button>
    </form>
  );
}
