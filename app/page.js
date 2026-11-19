"use client";
import { useEffect, useState } from "react";
import { supabase, isConfigured } from "@/lib/supabase";
import { VIBES } from "@/lib/utils";
import ListingCard from "@/components/ListingCard";
import Setup from "@/components/Setup";

export default function Home() {
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState(1);
  const [vibe, setVibe] = useState("all");
  const [sort, setSort] = useState("new");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!supabase) return;
    setLoading(true); setErr("");
    let q = supabase.from("listings").select("*").eq("is_active", true).gte("max_guests", guests);
    const c = city.trim().replace(/[%,()]/g, "");
    if (c) q = q.or(`city.ilike.%${c}%,state.ilike.%${c}%,title.ilike.%${c}%`);
    if (vibe !== "all") q = q.eq("vibe", vibe);
    if (sort === "low") q = q.order("price", { ascending: true });
    else if (sort === "high") q = q.order("price", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    const { data, error } = await q.limit(60);
    if (error) setErr(error.message); else setList(data || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [vibe, sort]);

  if (!isConfigured) return <Setup />;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>Wake up somewhere you&apos;ve never been</h1>
          <p>Homestays, cottages and unique stays across India, hosted by the people who live there. Free to book, pay at the property.</p>
          <form className="search" onSubmit={(e) => { e.preventDefault(); load(); }}>
            <label>Where
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Goa, Manali, Jaipur…" />
            </label>
            <label>Guests
              <select value={guests} onChange={(e) => setGuests(+e.target.value)}>
                {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn">Search</button>
          </form>
        </div>
      </section>

      <section className="wrap section">
        <div className="chips">
          {[["all", "All stays"], ...Object.entries(VIBES)].map(([k, n]) => (
            <button key={k} className={"chip" + (vibe === k ? " on" : "")} onClick={() => setVibe(k)}>{n}</button>
          ))}
        </div>
        <div className="bar">
          <span className="muted">{loading ? "Loading…" : `${list.length} stay${list.length === 1 ? "" : "s"}`}</span>
          <label className="muted">Sort{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="new">Newest</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
        {err && <p className="error">{err}</p>}
        {!loading && list.length === 0 && !err && (
          <div className="empty">No stays found yet. Try another place, or be the first to list your home.</div>
        )}
        <div className="grid">
          {list.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>
    </>
  );
}
