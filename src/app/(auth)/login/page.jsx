"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import authStyles from "@/components/auth/auth.module.css";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { requireEmail, requirePassword, ValidationError } from "@/lib/security/validation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [botField, setBotField] = useState(""); // honeypot
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (botField) return; // bot filled hidden field — silently drop

    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured on this environment yet.");
      return;
    }

    try {
      const cleanEmail = requireEmail(email);
      requirePassword(password);
      setLoading(true);
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to order, track rewards, and manage reservations."
      footer={
        <>
          <span>
            New to Ahar? <Link href="/signup">Create an account</Link>
          </span>
          <div className={authStyles.altRow}>
            <Link href="/login/magic-link">Email me a link</Link>
            <span>·</span>
            <Link href="/login/phone">Use phone</Link>
          </div>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Honeypot: hidden from users, tempting to bots. */}
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
          {loading ? <span className="spinner" /> : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
