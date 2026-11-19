"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { inr, fmtDate, STATUS_LABEL } from "@/lib/utils";
import Setup from "@/components/Setup";

export default function Trips() {
  const { user, loading } = useUser();
  const [trips, setTrips] = useState([]);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("bookings")
      .select("*, listings(title, city, state, photos, host_name)")
      .eq("guest_id", user.id)
      .order("check_in", { ascending: false });
    setTrips(data || []);
  };

  useEffect(() => {
    if (typeof window !== "undefined") setSent(new URLSearchParams(window.location.search).has("sent"));
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  if (!isConfigured) return <Setup />;
  if (loading) return <div className="wrap section muted">Loading…</div>;
  if (!user) return <div className="wrap section"><div className="empty">Please <Link href="/login">log in</Link> to see your trips.</div></div>;

  const cancel = async (b) => {
    setMsg("");
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
    if (error) setMsg(error.message); else { setMsg("Booking cancelled."); load(); }
  };

  return (
    <div className="wrap section">
      <h1>My trips</h1>
      {sent && <p className="notice">Request sent! The host will confirm soon. You&apos;ll see their reply here.</p>}
      {msg && <p className="notice">{msg}</p>}
      {trips.length === 0 ? (
        <div className="empty">No trips yet. <Link href="/">Find a stay</Link>.</div>
      ) : (
        <div className="stack">
          {trips.map((b) => {
            const l = b.listings || {};
            return (
              <div key={b.id} className="card trip">
                {l.photos?.[0] ? <img src={l.photos[0]} alt="" /> : <div className="nophoto">Stay</div>}
                <div className="pad">
                  <div className="bar">
                    <Link href={`/listing/${b.listing_id}`}><strong>{l.title || "Stay"}</strong></Link>
                    <span className={"status " + b.status}>{STATUS_LABEL[b.status]}</span>
                  </div>
                  <div className="muted">{l.city}{l.state ? `, ${l.state}` : ""} · Host: {l.host_name}</div>
                  <div>{fmtDate(b.check_in)} – {fmtDate(b.check_out)} · {b.guests} guest{b.guests > 1 ? "s" : ""} · <strong>{inr(b.total)}</strong> at property</div>
                  {b.host_reply && <p className="quote">Host: “{b.host_reply}”</p>}
                  {(b.status === "pending" || b.status === "approved") && (
                    <button className="ghost" onClick={() => cancel(b)}>Cancel booking</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
