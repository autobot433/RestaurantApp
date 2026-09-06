import "./globals.css";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Providers from "@/components/providers/Providers";
import Nav from "@/components/Nav";
import CartDrawer from "@/components/CartDrawer";

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Ahar — Modern Dining, Elevated",
    template: "%s · Ahar",
  },
  description:
    "Ahar — elegant online ordering, loyalty rewards, and reservations for the modern table.",
  manifest: "/manifest.json",
  applicationName: "Ahar",
  appleWebApp: { capable: true, title: "Ahar", statusBarStyle: "black-translucent" },
};

export const viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <Providers>
          <div className="page-wrap">
            <Nav />
            <main className="page-main">{children}</main>
            <SiteFooter />
          </div>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 0",
        color: "var(--muted)",
        fontSize: "0.85rem",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ fontFamily: "var(--font-display-stack)", fontSize: "1.4rem", color: "var(--cream)" }}>
          Ahar
        </span>
        <span>© {new Date().getFullYear()} Ahar. Crafted with care.</span>
      </div>
    </footer>
  );
}
