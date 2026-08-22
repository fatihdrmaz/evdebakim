import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Evde Bakım", description: "Hasta, seans ve stok takibi", manifest: "/manifest.json" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#0d9488" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
