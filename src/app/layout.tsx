import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const editorial = localFont({
  src: "../assets/fonts/instrument-serif-latin.woff2",
  variable: "--font-editorial",
  display: "swap",
  weight: "400",
});
const sans = localFont({
  src: "../assets/fonts/inter-latin.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Moksh Goel — Becoming",
  description: "Ideas, experiments, and everything in between. A small constellation of work and learning by Moksh Goel, Computer Science at VIT Chennai.",
  openGraph: { title: "Moksh Goel — Becoming", description: "Ideas / experiments / everything in between", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f4f0e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${editorial.variable} ${sans.variable}`}>{children}</body></html>;
}
