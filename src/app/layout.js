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
    default: "Freshly — Fresh, Fast, Simple Ordering",
    template: "%s · Freshly",
  },
  description:
    "Freshly — order food, earn rewards, and book a table, all in one place.",
  manifest: "/manifest.json",
  applicationName: "Freshly",
  appleWebApp: { capable: true, title: "Freshly", statusBarStyle: "black-translucent" },
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
          Freshly
        </span>
        <span>© {new Date().getFullYear()} Freshly. Crafted with care.</span>
      </div>
    </footer>
  );
}
