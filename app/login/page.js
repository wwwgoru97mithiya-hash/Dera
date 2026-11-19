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
    if (error) setErr(error.message); else setSent(true);
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
          <form onSubmit={verify} className="form">
            <p>We&apos;ve emailed a login code to <strong>{email}</strong>. Type it here. It works even if you read the email on your phone.</p>
            <label>Login code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6,8}"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{ fontSize: 24, letterSpacing: 6 }}
              />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? "Checking…" : "Log in"}</button>
            <p className="muted small">
              You can also tap the link in the email on this device.{" "}
              <button type="button" className="linklike" onClick={send} disabled={busy}>Send a new code</button>
              {" · "}
              <button type="button" className="linklike" onClick={() => { setSent(false); setCode(""); setErr(""); }}>Use another email</button>
            </p>
          </form>
        ) : (
          <form onSubmit={send} className="form">
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send me a login code"}</button>
            <p className="muted small">No password needed. New here? This creates your account.</p>
          </form>
        )}
      </div>
    </div>
  );
}
