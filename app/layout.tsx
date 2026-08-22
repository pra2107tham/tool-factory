import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Using the Vercel URL until a real domain is picked — swap here (and in
// sitemap.ts / robots.ts) once one is, this affects every absolute URL
// Next.js generates for metadata, OG images, and the sitemap.
export const metadata: Metadata = {
  metadataBase: new URL("https://tool-factory-lac.vercel.app"),
  title: {
    default: "Tool Factory — one small tool, shipped every day",
    template: "%s — Tool Factory",
  },
  description:
    "A different small, useful web tool, shipped every day for 30 days. No sign-up, no bloat — just the tool.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
