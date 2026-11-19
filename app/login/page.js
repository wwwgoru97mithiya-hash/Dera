"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabase";
import Setup from "@/components/Setup";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // login | signup | link
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  if (!isConfigured) return <Setup />;

  const friendly = (m) => {
    if (/invalid login credentials/i.test(m)) return "Wrong email or password.";
    if (/already registered|already exists/i.test(m)) return "This email already has an account. Please log in instead.";
    if (/rate limit/i.test(m)) return "Too many attempts right now. Please wait a while and try again.";
    if (/email not confirmed/i.test(m)) return "Please confirm your email first, or use the email link option below.";
    return m;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    const creds = { email: email.trim(), password };
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp(creds);
      setBusy(false);
      if (error) return setErr(friendly(error.message));
      if (!data.session) return setInfo("Account created. Please check your email to confirm it, then log in.");
      router.push("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword(creds);
      setBusy(false);
      if (error) return setErr(friendly(error.message));
      router.push("/");
    }
  };

  const sendLink = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(friendly(error.message)); else setLinkSent(true);
  };

  const tab = (m, label) => (
    <button type="button" className={"chip" + (mode === m ? " on" : "")}
      onClick={() => { setMode(m); setErr(""); setInfo(""); setLinkSent(false); }}>{label}</button>
  );

  return (
    <div className="wrap section narrow">
      <div className="card pad">
        <h1>{mode === "signup" ? "Create your account" : "Log in"}</h1>
        <div className="chips">
          {tab("login", "Log in")}
          {tab("signup", "Sign up")}
        </div>

        {mode !== "link" ? (
          <form onSubmit={submit} className="form">
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            <label>Password
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            </label>
            {err && <p className="error">{err}</p>}
            {info && <p className="notice">{info}</p>}
            <button className="btn" disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
            <p className="muted small">
              {mode === "login" ? "New to Dera? " : "Already have an account? "}
              <button type="button" className="linklike" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setInfo(""); }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
              {" · "}
              <button type="button" className="linklike" onClick={() => { setMode("link"); setErr(""); setInfo(""); }}>
                Forgot password? Email me a login link
              </button>
            </p>
          </form>
        ) : linkSent ? (
          <div className="form">
            <p>We&apos;ve sent a login link to <strong>{email}</strong>. Open that email <strong>on this device</strong> and tap <strong>Sign in</strong>.</p>
            <p className="muted small">Check spam if you don&apos;t see it.</p>
            <button type="button" className="linklike" onClick={() => setMode("login")}>Back to password login</button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="form">
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </label>
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? "Sending…" : "Email me a login link"}</button>
            <button type="button" className="linklike" onClick={() => setMode("login")}>Back to password login</button>
          </form>
        )}
      </div>
    </div>
  );
}
