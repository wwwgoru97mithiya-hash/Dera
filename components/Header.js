"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function Header() {
  const { user } = useUser();
  const path = usePathname();
  const router = useRouter();

  const logout = async () => {
    await supabase?.auth.signOut();
    router.push("/");
  };

  const link = (href, label) => (
    <Link href={href} className={path === href ? "on" : ""}>{label}</Link>
  );

  return (
    <header className="topbar">
      <div className="wrap nav">
        <Link href="/" className="logo" aria-label="Dera home">
          <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4 34 20 6l16 28Z" fill="#f2a20c"/><path d="M15 34l5-9 5 9Z" fill="#3b1f3a"/><circle cx="31" cy="9" r="3" fill="#fff"/></svg>
          Dera
        </Link>
        <nav className="links">
          {link("/", "Explore")}
          {user && link("/trips", "My trips")}
          {user && link("/host", "Host dashboard")}
          {!user && link("/host/new", "Become a host")}
          {user
            ? <button className="linkbtn" onClick={logout}>Log out</button>
            : <Link href="/login" className="pill">Log in</Link>}
        </nav>
      </div>
    </header>
  );
}
