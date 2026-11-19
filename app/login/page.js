"use client";
import { useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import Setup from "@/components/Setup";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!isConfigured) return <Setup />;

  const send = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };

  return (
    <div className="wrap section narrow">
      <div className="card pad">
        <h1>Log in or sign up</h1>
        {sent ? (
          <p>We&apos;ve sent a login link to <strong>{email}</strong>. Open your email and tap the link to continue. Check spam if you don&apos;t see it.</p>
        ) : (
          <form onSubmit={send} className="form">
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send me a login link"}</button>
            <p className="muted small">No password needed. New here? This creates your account.</p>
          </form>
        )}
      </div>
    </div>
  );
}
