import Link from "next/link";
import { allBundles } from "@/lib/db";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";

export const metadata = { title: "Bundles | HelioConvert", description: "A complete topic in one purchase: every format, one price." };

/* eslint-disable @next/next/no-img-element */
export default async function Bundles() {
  const [bundles, region] = await Promise.all([allBundles(), getRegion()]);
  const t = strings(region.lang);
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-mono text-xs text-gold">&gt; {t.bundles.toUpperCase()} · {bundles.length}</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl"><span className="gold-text">{t.bundles}</span></h1>
      <p className="mt-3 max-w-xl text-muted">{t.bundlesSub}</p>
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {bundles.map((b) => (
          <Link key={b.id} href={`/b/${b.slug}`} className="edge glow-hover overflow-hidden">
            {b.cover_url && <img src={b.cover_url} alt={b.title} loading="lazy" className="aspect-[3/4] w-full object-cover" />}
            <div className="p-4">
              <p className="font-mono text-[10px] uppercase text-gold">{t.bundleTag} · {b.product_count} {t.itemsWord}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium">{b.title}</p>
              <p className="mt-2 text-sm font-semibold text-gold">{fmtPrice(b.price, region)}</p>
            </div>
          </Link>
        ))}
      </div>
      {bundles.length === 0 && <p className="mt-12 text-muted">Bundles are being added. Check back soon.</p>}
    </section>
  );
}
