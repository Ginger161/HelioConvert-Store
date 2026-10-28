import { Suspense } from "react";
import { allProducts } from "@/lib/db";
import Catalog from "../catalog";

export const metadata = { title: "Library | HelioConvert", description: "Search every book, guide, mini-course, checklist and prompt pack." };

// searchParams is request-time data, so it is read inside its own Suspense boundary.
async function LibraryResults({ searchParams }: { searchParams: Promise<{ q?: string; format?: string }> }) {
  const [items, sp] = await Promise.all([allProducts(), searchParams]);
  return <Catalog items={items} initialQ={sp.q ?? ""} initialFormat={sp.format ?? "All"} />;
}

export default function Library({ searchParams }: { searchParams: Promise<{ q?: string; format?: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-6xl px-5 py-16 font-mono text-xs text-jade">&gt; [SYS] loading library…</div>}>
      <LibraryResults searchParams={searchParams} />
    </Suspense>
  );
}
