"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { requirePassword, assert, ValidationError } from "@/lib/security/validation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecking(false);
      return;
    }
    getSupabaseClient()
      .auth.getUser()
      .then(({ data }) => {
        setAuthed(Boolean(data.user));
        setChecking(false);
      });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      requirePassword(password);
      assert(password === confirm, "Passwords do not match.");
      setLoading(true);
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) {
        setError(authError.message);
        return;
      }
      setNotice("Password updated.");
      setPassword("");
      setConfirm("");
      setTimeout(() => router.push("/account"), 1200);
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Change password"
      subtitle="Choose a new password for your account."
      footer={<Link href="/account">← Back to account</Link>}
    >
      {checking ? (
        <p className="muted">Loading…</p>
      ) : !authed ? (
        <p className="muted">
          Please <Link href="/login" style={{ color: "var(--gold)" }}>sign in</Link> to change your password.
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm new password</label>
            <input id="confirm" className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          {notice && <p className="success-text" style={{ marginBottom: 12 }}>{notice}</p>}
          <button className="btn btn-gold btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
