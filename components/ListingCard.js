import Link from "next/link";
import { VIBES, inr } from "@/lib/utils";

export default function ListingCard({ l }) {
  const photo = l.photos?.[0];
  return (
    <Link href={`/listing/${l.id}`} className="lcard">
      <div className="lphoto">
        {photo ? <img src={photo} alt={l.title} loading="lazy" /> : <div className="nophoto">No photo yet</div>}
        <span className="tag">{VIBES[l.vibe] || "Stay"}</span>
      </div>
      <div className="linfo">
        <h3>{l.title}</h3>
        <div className="muted">{l.city}, {l.state} · up to {l.max_guests} guests</div>
        <div><strong>{inr(l.price)}</strong> <span className="muted">/ night</span></div>
      </div>
    </Link>
  );
}
