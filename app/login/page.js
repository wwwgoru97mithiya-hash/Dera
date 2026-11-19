"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabase";
import Setup from "@/components/Setup";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!isConfigured) return <Setup />;

  const send = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message.includes("rate limit") ? "Too many login emails right now. Please wait a while and try again." : error.message); else setSent(true);
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setErr("That code didn't work. Check it, or send a new one.");
    else router.push("/");
  };

  return (
    <div className="wrap section narrow">
      <div className="card pad">
        <h1>Log in or sign up</h1>
        {sent ? (
          <div className="form">
            <p>We&apos;ve sent a login link to <strong>{email}</strong>.</p>
            <p><strong>Open that email on this device</strong> and tap <strong>Sign in</strong>. The link logs in whichever device you tap it on.</p>
            <p className="muted small">On a computer? Open your email (for example gmail.com) here in this browser. Check spam if you don&apos;t see it.</p>
            {err && <p className="error">{err}</p>}
            <p className="muted small">
              <button type="button" className="linklike" onClick={send} disabled={busy}>Send a new link</button>
              {" · "}
              <button type="button" className="linklike" onClick={() => { setSent(false); setErr(""); }}>Use another email</button>
            </p>
          </div>
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
