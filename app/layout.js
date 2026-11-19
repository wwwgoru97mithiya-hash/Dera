import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Dera — Homestays across India",
  description: "Find and book homestays, cottages and unique stays across India. Free to use. Pay at the property.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#3b1f3a" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="wrap">
            <strong>Dera</strong> · Free homestay booking for India · Guests pay the host at the property
          </div>
        </footer>
      </body>
    </html>
  );
}
