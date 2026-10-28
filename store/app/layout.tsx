import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getRegion } from "@/lib/region-server";
import { abs, AUTHOR, MAIN_SITE, SITE_NAME, SITE_URL } from "@/lib/site";
import { entityGraph } from "@/lib/entity";
import JsonLd from "./json-ld";
import { RegionProvider } from "./region-provider";
import SideNav from "./side-nav";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Courses, books and bundles by ${AUTHOR}`,
  description:
    "The HelioConvert Store: step-by-step books, guides, mini-courses, checklists and prompt packs on AI, freelancing, marketing and wellness, by Ginger-Eke Chienyegom, founder of HelioConvert. Instant PDF download, pay in Naira.",
  applicationName: SITE_NAME,
  keywords: [SITE_NAME, "HelioConvrt Store", "HelioConvert", "HelioConvrt", AUTHOR, "online courses Nigeria", "ebooks", "mini-courses", "checklists", "prompt packs", "AI automation", "freelancing", "digital marketing"],
  authors: [{ name: AUTHOR, url: abs("/about") }],
  creator: AUTHOR,
  publisher: "HelioConvert",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_NG", title: SITE_NAME, description: `Pick a course. Learn the skill. Earn and grow. By ${AUTHOR} of HelioConvert.`, images: ["/logo.png"] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: `Pick a course. Learn the skill. Earn and grow. By ${AUTHOR} of HelioConvert.`, images: ["/logo.png"] },
  robots: { index: true, follow: true },
  // paste the token Google/Bing give you into these env vars; they render the verification <meta> tags
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION, other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined },
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/emblem.png" alt="" className="h-9 w-9" />
      <span className="font-semibold tracking-tight">HelioConvert</span>
      <span className="hidden font-mono text-xs text-jade sm:inline">/ library</span>
    </Link>
  );
}

// Static shell shown instantly while the region (cookies / geo headers) resolves at request time.
function ShellFallback() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-[#060a09]/85 p-4 lg:block"><Logo /></aside>
      <header className="border-b border-line px-4 py-3 lg:hidden"><Logo /></header>
      <main className="flex-1 lg:pl-64" />
    </>
  );
}

// new Date() is an unstable value under Cache Components, so the footer year is computed in a cached function.
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// Everything that depends on the visitor (region, then page data) lives inside this one Suspense boundary.
async function RegionShell({ children }: { children: React.ReactNode }) {
  const [region, year] = await Promise.all([getRegion(), currentYear()]);
  return (
    <RegionProvider region={region}>
      <SideNav />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-5 py-8 text-center text-xs text-muted">
          <p>
            © {year} <a href={MAIN_SITE} className="hover:text-foreground">HelioConvert</a> · by <Link href="/about" className="hover:text-foreground">{AUTHOR}</Link>, founder of HelioConvert · Abuja, Nigeria
          </p>
          <p className="mt-1 font-mono">We track leads, not just layouts.</p>
        </footer>
      </div>
    </RegionProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={entityGraph()} />
        <div className="ambient" aria-hidden>
          <span className="orb o1" /><span className="orb o2" /><span className="orb o3" />
          <span className="grid" /><span className="grain" />
        </div>
        <Suspense fallback={<ShellFallback />}>
          <RegionShell>{children}</RegionShell>
        </Suspense>
      </body>
    </html>
  );
}
