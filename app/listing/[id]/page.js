"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { VIBES, inr, fmtDate, nightsBetween, todayISO } from "@/lib/utils";
import Setup from "@/components/Setup";

export default function ListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [l, setL] = useState(null);
  const [taken, setTaken] = useState([]);
  const [photo, setPhoto] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [f, setF] = useState({ check_in: "", check_out: "", guests: 1, guest_name: "", guest_phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!supabase || !id) return;
    supabase.from("listings").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) setNotFound(true); else setL(data);
    });
    supabase.rpc("booked_dates", { lid: Number(id) }).then(({ data }) => setTaken(data || []));
  }, [id]);

  if (!isConfigured) return <Setup />;
  if (notFound) return <div className="wrap section"><div className="empty">This stay doesn&apos;t exist or was removed. <Link href="/">Back to Explore</Link></div></div>;
  if (!l) return <div className="wrap section muted">Loading…</div>;

  const nights = nightsBetween(f.check_in, f.check_out);
  const total = nights * l.price;
  const isOwner = user && user.id === l.host_id;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const clash = nights > 0 && taken.some((t) => f.check_in < t.check_out && f.check_out > t.check_in);

  const request = async (e) => {
    e.preventDefault();
    setErr("");
    if (!user) { router.push("/login"); return; }
    if (nights < 1) { setErr("Check-out must be after check-in."); return; }
    if (clash) { setErr("Those dates are already booked. Please pick other dates."); return; }
    if (!/^[0-9+ -]{10,15}$/.test(f.guest_phone.trim())) { setErr("Please enter a valid phone number."); return; }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      listing_id: l.id,
      guest_name: f.guest_name.trim(),
      guest_phone: f.guest_phone.trim(),
      check_in: f.check_in,
      check_out: f.check_out,
      guests: Number(f.guests),
      total,
      message: f.message.trim(),
    });
    setBusy(false);
    if (error) setErr(error.message);
    else router.push("/trips?sent=1");
  };

  const photos = l.photos?.length ? l.photos : [];

  return (
    <div className="wrap section">
      <Link href="/" className="muted">← All stays</Link>
      <h1 className="title">{l.title}</h1>
      <p className="muted">{VIBES[l.vibe]} · {l.city}, {l.state} · Hosted by {l.host_name}</p>

      <div className="gallery">
        {photos.length ? <img src={photos[photo]} alt={l.title} /> : <div className="nophoto big">No photos yet</div>}
        {photos.length > 1 && (
          <div className="thumbs">
            {photos.map((p, i) => (
              <button key={p} className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}>
                <img src={p} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail">
        <div>
          <h2>About this stay</h2>
          <p className="pre">{l.description || "The host hasn't added a description yet."}</p>
          {l.amenities?.length > 0 && (
            <>
              <h3>What&apos;s included</h3>
              <div className="amen">{l.amenities.map((a) => <span key={a}>{a}</span>)}</div>
            </>
          )}
          <h3>Already booked</h3>
          {taken.length
            ? <ul className="muted">{taken.map((t) => <li key={t.check_in}>{fmtDate(t.check_in)} – {fmtDate(t.check_out)}</li>)}</ul>
            : <p className="muted">No bookings yet. All dates are open.</p>}
        </div>

        <aside className="card pad book">
          <div className="price"><strong>{inr(l.price)}</strong> <span className="muted">/ night</span></div>
          {isOwner ? (
            <p>This is your listing. <Link href="/host">Manage it in your dashboard</Link>.</p>
          ) : (
            <form onSubmit={request} className="form">
              <div className="two">
                <label>Check in<input type="date" required min={todayISO()} value={f.check_in} onChange={set("check_in")} /></label>
                <label>Check out<input type="date" required min={f.check_in || todayISO()} value={f.check_out} onChange={set("check_out")} /></label>
              </div>
              <label>Guests
                <select value={f.guests} onChange={set("guests")}>
                  {Array.from({ length: l.max_guests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </label>
              <label>Your name<input required maxLength={60} value={f.guest_name} onChange={set("guest_name")} /></label>
              <label>Phone (shared with host only)<input required type="tel" maxLength={15} value={f.guest_phone} onChange={set("guest_phone")} placeholder="98765 43210" /></label>
              <label>Message to host (optional)<textarea rows={3} maxLength={500} value={f.message} onChange={set("message")} placeholder="Arrival time, questions…" /></label>
              {nights > 0 && (
                <div className="sum">
                  <div><span>{inr(l.price)} × {nights} night{nights > 1 ? "s" : ""}</span><span>{inr(total)}</span></div>
                  <div className="tot"><span>Pay at property</span><span>{inr(total)}</span></div>
                </div>
              )}
              {clash && <p className="error">Those dates are already booked.</p>}
              {err && <p className="error">{err}</p>}
              <button className="btn" disabled={busy}>{user ? (busy ? "Sending…" : "Request to book") : "Log in to request"}</button>
              <p className="muted small">You won&apos;t pay anything now. The host confirms your request, and you pay them at check-in.</p>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
