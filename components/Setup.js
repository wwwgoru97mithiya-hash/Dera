export default function Setup() {
  return (
    <div className="wrap section">
      <div className="card pad">
        <h2>Almost there</h2>
        <p>Dera isn't connected to its database yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel → Project → Settings → Environment Variables, then redeploy.</p>
      </div>
    </div>
  );
}
