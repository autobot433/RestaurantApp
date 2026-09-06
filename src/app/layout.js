import "./globals.css";
import { Cormorant_Garamond, Jost } from "next/font/google";

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const fontBody = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "Ahar",
  description: "Ahar – elegant ordering, rewards, and reservations experience.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable}`}
    >
      <body
        style={{
          backgroundColor: "#111111",
          color: "#F5F0E8",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
