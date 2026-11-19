"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { inr, fmtDate, STATUS_LABEL } from "@/lib/utils";
import Setup from "@/components/Setup";

export default function HostDashboard() {
  const { user, loading } = useUser();
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [replies, setReplies] = useState({});
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("requests");

  const load = async () => {
    if (!user) return;
    const { data: ls } = await supabase.from("listings").select("*").eq("host_id", user.id).order("created_at", { ascending: false });
    setListings(ls || []);
    const ids = (ls || []).map((l) => l.id);
    if (ids.length) {
      const { data: bs } = await supabase.from("bookings").select("*, listings(title)").in("listing_id", ids).order("created_at", { ascending: false });
      setRequests(bs || []);
    } else setRequests([]);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  if (!isConfigured) return <Setup />;
  if (loading) return <div className="wrap section muted">Loading…</div>;
  if (!user) return <div className="wrap section"><div className="empty">Please <Link href="/login">log in</Link> to see your dashboard.</div></div>;

  const decide = async (b, status) => {
    setMsg("");
    const { error } = await supabase.from("bookings")
      .update({ status, host_reply: (replies[b.id] || "").trim() })
      .eq("id", b.id);
    if (error) {
      setMsg(error.message.includes("no_double_booking")
        ? "You already approved another booking for these dates. Decline this one or cancel the other first."
        : error.message);
    } else {
      setMsg(status === "approved" ? "Booking confirmed. The guest can now see your reply." : "Request declined.");
      load();
    }
  };

  const toggleActive = async (l) => {
    await supabase.from("listings").update({ is_active: !l.is_active }).eq("id", l.id);
    load();
  };

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="wrap section">
      <div className="bar">
        <h1>Host dashboard</h1>
        <Link href="/host/new" className="btn">+ Add a listing</Link>
      </div>
      <div className="chips">
        <button className={"chip" + (tab === "requests" ? " on" : "")} onClick={() => setTab("requests")}>
          Booking requests {pending.length > 0 && <span className="count">{pending.length}</span>}
        </button>
        <button className={"chip" + (tab === "listings" ? " on" : "")} onClick={() => setTab("listings")}>My listings ({listings.length})</button>
      </div>
      {msg && <p className="notice">{msg}</p>}

      {tab === "requests" && (
        requests.length === 0
          ? <div className="empty">No booking requests yet. They&apos;ll appear here when guests ask to stay.</div>
          : <div className="stack">
              {requests.map((b) => (
                <div key={b.id} className="card pad req">
                  <div className="bar">
                    <strong>{b.listings?.title}</strong>
                    <span className={"status " + b.status}>{STATUS_LABEL[b.status]}</span>
                  </div>
                  <div>{fmtDate(b.check_in)} – {fmtDate(b.check_out)} · {b.guests} guest{b.guests > 1 ? "s" : ""} · <strong>{inr(b.total)}</strong> at property</div>
                  <div>Guest: <strong>{b.guest_name}</strong> · {b.guest_phone}</div>
                  {b.message && <p className="quote">“{b.message}”</p>}
                  {b.status === "pending" ? (
                    <div className="form">
                      <label>Reply to guest (address, directions, your phone)
                        <textarea rows={2} maxLength={500} value={replies[b.id] || ""} onChange={(e) => setReplies({ ...replies, [b.id]: e.target.value })} />
                      </label>
                      <div className="row">
                        <button className="btn" onClick={() => decide(b, "approved")}>Approve</button>
                        <button className="ghost" onClick={() => decide(b, "declined")}>Decline</button>
                      </div>
                    </div>
                  ) : b.host_reply ? <p className="muted">Your reply: {b.host_reply}</p> : null}
                </div>
              ))}
            </div>
      )}

      {tab === "listings" && (
        listings.length === 0
          ? <div className="empty">You haven&apos;t listed a place yet. <Link href="/host/new">Add your first listing</Link>.</div>
          : <div className="stack">
              {listings.map((l) => (
                <div key={l.id} className="card pad mylisting">
                  {l.photos?.[0] && <img src={l.photos[0]} alt="" />}
                  <div>
                    <Link href={`/listing/${l.id}`}><strong>{l.title}</strong></Link>
                    <div className="muted">{l.city}, {l.state} · {inr(l.price)} / night</div>
                    <div className="muted small">{l.is_active ? "Visible to guests" : "Hidden from search"}</div>
                  </div>
                  <button className="ghost" onClick={() => toggleActive(l)}>{l.is_active ? "Hide" : "Show"}</button>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}
