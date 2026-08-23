import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = { title: "Evde Bakım", description: "Hasta, seans, stok ve ödeme takibi", manifest: "/manifest.json" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2563eb", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={figtree.variable}>
      <body className="font-sans overflow-x-hidden">{children}</body>
    </html>
  );
}
