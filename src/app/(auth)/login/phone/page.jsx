"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { getSupabaseClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/appConfig";
import { assert, ValidationError } from "@/lib/security/validators";

const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;

export default function PhoneLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("phone"); // 'phone' | 'code'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Authentication is not configured on this environment yet.");
      return;
    }
    try {
      assert(PHONE_RE.test(phone.trim()), "Enter a phone number in E.164 format, e.g. +14155552671.");
      setLoading(true);
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setStage("code");
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setError("");
    try {
      assert(/^[0-9]{4,8}$/.test(code.trim()), "Enter the code we texted you.");
      setLoading(true);
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code.trim(),
        type: "sms",
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in with phone"
      subtitle={stage === "phone" ? "We'll text you a one-time code." : `Enter the code sent to ${phone}.`}
      footer={<Link href="/login">← Back to sign in</Link>}
    >
      {stage === "phone" ? (
        <form onSubmit={sendCode} noValidate>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" className="input" type="tel" placeholder="+14155552671" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-gold btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Text me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input id="code" className="input" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" required />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn btn-gold btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Verify & sign in"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
