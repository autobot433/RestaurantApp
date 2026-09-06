"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import {
  requireEmail,
  requirePassword,
  cleanString,
  assert,
  ValidationError,
} from "@/lib/security/validation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [botField, setBotField] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (botField) return;

    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured on this environment yet.");
      return;
    }

    try {
      const fullName = cleanString(form.fullName, { max: 120, field: "name" });
      assert(fullName.length >= 2, "Please enter your name.");
      const email = requireEmail(form.email);
      requirePassword(form.password);
      assert(form.password === form.confirm, "Passwords do not match.");

      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data.session) {
        router.push("/account");
        router.refresh();
      } else {
        setNotice("Check your email to confirm your account.");
      }
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Join Freshly"
      subtitle="Create an account to start ordering and earning rewards."
      footer={
        <span>
          Already have an account? <Link href="/login">Sign in</Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" value={form.fullName} onChange={update("fullName")} autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={form.password} onChange={update("password")} autoComplete="new-password" required />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" className="input" type="password" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" required />
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
        {notice && <p className="success-text" style={{ marginBottom: 12 }}>{notice}</p>}

        <button className="btn btn-gold btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
