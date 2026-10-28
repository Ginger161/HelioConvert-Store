import Link from "next/link";
import { notFound } from "next/navigation";
import { bundleBySlug } from "@/lib/db";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { abs, trim } from "@/lib/site";
import JsonLd from "../../json-ld";
import WithLoading from "../../page-loading";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = await bundleBySlug((await params).slug);
  if (!b) return {};
  const desc = trim(b.description?.split("\n\nIncluded:")[0]) || `${b.title}: ${b.product_count} resources in one bundle.`;
  return {
    title: `${b.title} Bundle: ${b.product_count} Resources in One Download | HelioConvert`,
    description: desc,
    alternates: { canonical: `/b/${b.slug}` },
    openGraph: { type: "website", title: `${b.title} bundle`, description: desc, url: abs(`/b/${b.slug}`), images: b.cover_url ? [b.cover_url] : undefined },
    twitter: { card: "summary_large_image", title: `${b.title} bundle`, description: desc, images: b.cover_url ? [b.cover_url] : undefined },
  };
}

export default function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><BundleContent params={params} /></WithLoading>;
}

async function BundleContent({ params }: { params: Promise<{ slug: string }> }) {
  const [b, region] = await Promise.all([bundleBySlug((await params).slug), getRegion()]);
  if (!b) notFound();
  const t = strings(region.lang);
  const separately = b.items.reduce((n, i) => n + Number(i.price), 0);
  return (
    <>
    <JsonLd data={{
      "@context": "https://schema.org", "@type": "Product", name: `${b.title} bundle`, sku: `bundle-${b.slug}`,
      description: trim(b.description?.split("\n\nIncluded:")[0]), image: b.cover_url ? [b.cover_url] : undefined,
      brand: { "@type": "Brand", name: "HelioConvert" }, category: b.category ?? undefined,
      offers: { "@type": "Offer", url: abs(`/b/${b.slug}`), price: String(b.price), priceCurrency: b.currency, availability: "https://schema.org/InStock" },
    }} />
    <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-[320px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {b.cover_url && <img src={b.cover_url} alt={b.title} className="w-full rounded-2xl border border-line" />}
      <div>
        <p className="font-mono text-xs uppercase text-gold">{t.bundleTag} · {b.category} · {b.product_count} {t.itemsWord}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{b.title}</h1>
        <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{b.description?.split("\n\nIncluded:")[0]}</p>

        <p className="mt-6 font-mono text-xs text-jade">&gt; {t.inside.toUpperCase()}</p>
        <ul className="mt-2 divide-y divide-line text-sm">
          {b.items.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 py-2">
              <Link href={`/p/${i.slug}`} className="hover:underline">{i.title}</Link>
              <span className="shrink-0 font-mono text-xs text-muted">{i.format}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-2xl text-gold">
          {fmtPrice(b.price, region)} <span className="ml-2 text-sm text-muted line-through">{fmtPrice(separately, region)}</span>
        </p>
        <p className="text-xs text-muted">{t.note}</p>
        <form action="/api/checkout" method="POST" className="mt-4 flex flex-wrap gap-2">
          <input type="hidden" name="kind" value="bundle" />
          <input type="hidden" name="bundleId" value={b.id} />
          <input required type="email" name="email" placeholder={t.email} className="glass rounded-lg px-3 py-2 text-sm" />
          <button className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-black">{t.buyBundle}</button>
        </form>
        <p className="mt-3 text-xs text-muted">{t.instant} {t.individually}: <span className="text-foreground">↑</span></p>
      </div>
    </div>
    </>
  );
}
