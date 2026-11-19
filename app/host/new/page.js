"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { VIBES, STATES } from "@/lib/utils";
import Setup from "@/components/Setup";

const AMENITIES = ["Wi-Fi", "AC", "Parking", "Kitchen", "Hot water", "Breakfast", "Home meals", "TV", "Power backup", "Pet friendly", "Mountain view", "Sea view"];
const MAX_PHOTOS = 6;
const MAX_MB = 5;

export default function NewListing() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [f, setF] = useState({ title: "", host_name: "", city: "", state: "Goa", vibe: "homestay", price: 2000, max_guests: 2, description: "" });
  const [amen, setAmen] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  if (!isConfigured) return <Setup />;
  if (loading) return <div className="wrap section muted">Loading…</div>;
  if (!user) return (
    <div className="wrap section narrow"><div className="card pad">
      <h1>Host your place on Dera</h1>
      <p>It&apos;s free to list. Log in first, then add your stay with photos in a few minutes.</p>
      <Link href="/login" className="btn">Log in to start</Link>
    </div></div>
  );

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (a) => setAmen(amen.includes(a) ? amen.filter((x) => x !== a) : [...amen, a]);

  const pick = (e) => {
    setErr("");
    const chosen = Array.from(e.target.files || []);
    const ok = chosen.filter((file) => file.type.startsWith("image/") && file.size <= MAX_MB * 1024 * 1024);
    if (ok.length < chosen.length) setErr(`Some files were skipped. Use images under ${MAX_MB} MB.`);
    setFiles([...files, ...ok].slice(0, MAX_PHOTOS));
    e.target.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (files.length === 0) { setErr("Please add at least one photo."); return; }
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`Uploading photo ${i + 1} of ${files.length}…`);
        const file = files[i];
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type });
        if (error) throw error;
        urls.push(supabase.storage.from("photos").getPublicUrl(path).data.publicUrl);
      }
      setBusy("Publishing…");
      const { data, error } = await supabase.from("listings").insert({
        title: f.title.trim(),
        host_name: f.host_name.trim(),
        city: f.city.trim(),
        state: f.state,
        vibe: f.vibe,
        price: Number(f.price),
        max_guests: Number(f.max_guests),
        description: f.description.trim(),
        amenities: amen,
        photos: urls,
      }).select("id").single();
      if (error) throw error;
      router.push(`/listing/${data.id}`);
    } catch (ex) {
      setErr(ex.message || "Something went wrong. Please try again.");
      setBusy("");
    }
  };

  return (
    <div className="wrap section narrow">
      <h1>List your place</h1>
      <p className="muted">Free to list. Guests send you a request, you approve it, and they pay you at check-in.</p>
      <form className="form card pad" onSubmit={submit}>
        <label>Title<input required minLength={3} maxLength={80} value={f.title} onChange={set("title")} placeholder="Bamboo cottage by the river" /></label>
        <label>Your name (shown to guests)<input required maxLength={40} value={f.host_name} onChange={set("host_name")} placeholder="Anjali" /></label>
        <div className="two">
          <label>City or area<input required minLength={2} maxLength={60} value={f.city} onChange={set("city")} placeholder="Wayanad" /></label>
          <label>State<select value={f.state} onChange={set("state")}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
        </div>
        <div className="two">
          <label>Type of stay<select value={f.vibe} onChange={set("vibe")}>{Object.entries(VIBES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label>Max guests<input type="number" required min={1} max={30} value={f.max_guests} onChange={set("max_guests")} /></label>
        </div>
        <label>Price per night (₹)<input type="number" required min={100} max={500000} value={f.price} onChange={set("price")} /></label>
        <label>Description<textarea rows={5} maxLength={2000} value={f.description} onChange={set("description")} placeholder="What makes your place special? Nearby sights, food, how to reach…" /></label>
        <fieldset>
          <legend>What&apos;s included</legend>
          <div className="amen pick">
            {AMENITIES.map((a) => (
              <button type="button" key={a} className={amen.includes(a) ? "on" : ""} onClick={() => toggle(a)}>{a}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Photos (up to {MAX_PHOTOS}, first one is the cover)</legend>
          <div className="previews">
            {previews.map((p, i) => (
              <div key={p} className="prev">
                <img src={p} alt={`Photo ${i + 1}`} />
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove photo">×</button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <label className="addphoto">+ Add photos<input type="file" accept="image/*" multiple onChange={pick} hidden /></label>
            )}
          </div>
        </fieldset>
        {err && <p className="error">{err}</p>}
        <button className="btn" disabled={!!busy}>{busy || "Publish listing"}</button>
      </form>
    </div>
  );
}
