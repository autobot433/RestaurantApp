"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/appConfig";
import { requireEmail, ValidationError } from "@/lib/security/validators";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [botField, setBotField] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (botField) return;
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured on this environment yet.");
      return;
    }
    try {
      const cleanEmail = requireEmail(email);
      setLoading(true);
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Email me a link"
      subtitle="We'll send a secure sign-in link to your inbox — no password needed."
      footer={<Link href="/login">← Back to sign in</Link>}
    >
      {sent ? (
        <p className="success-text">
          Link sent. Check <strong>{email}</strong> and follow it to sign in.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={botField}
            onChange={(e) => setBotField(e.target.value)}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
            aria-hidden="true"
          />
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-gold btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Send link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
