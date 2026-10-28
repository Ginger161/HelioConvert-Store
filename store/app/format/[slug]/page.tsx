import Link from "next/link";
import { notFound } from "next/navigation";
import { allProducts } from "@/lib/db";
import { FORMATS } from "@/lib/formats";
import { fmtPrice } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { abs } from "@/lib/site";
import JsonLd from "../../json-ld";
import ProductCard from "../../product-card";
import WithLoading from "../../page-loading";

const bySlug = (slug: string) => FORMATS.find((f) => f.slug === slug);

export function generateStaticParams() {
  return FORMATS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const f = bySlug((await params).slug);
  if (!f) return {};
  return {
    title: `${f.plural}: Ready-made ${f.plural.toLowerCase()} on business, AI, money & wellbeing | HelioConvert`,
    description: `${f.blurb} Browse every ${f.key.toLowerCase()} in the HelioConvert library. Instant PDF download, pay in Naira.`,
    alternates: { canonical: `/format/${f.slug}` },
  };
}

export default function FormatPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><FormatContent params={params} /></WithLoading>;
}

async function FormatContent({ params }: { params: Promise<{ slug: string }> }) {
  const f = bySlug((await params).slug);
  if (!f) notFound();
  const [all, region] = await Promise.all([allProducts(), getRegion()]);
  const items = all.filter((i) => i.format === f.key);
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort();

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ItemList", name: f.plural, numberOfItems: items.length,
        itemListElement: items.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/p/${p.slug}`), name: p.title })),
      }} />
      <Link href="/library" className="text-xs text-muted hover:text-foreground">← Catalog</Link>
      <p className="mt-6 font-mono text-xs text-gold">&gt; FORMAT</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl"><span className="jade-text">{f.plural}</span></h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{f.blurb}</p>
      <p className="mt-3 font-mono text-xs uppercase text-jade-bright">{items.length} {f.plural.toLowerCase()}</p>
      <div className="glow-line mt-8 max-w-md" />

      {cats.map((c) => (
        <div key={c} className="mt-14">
          <h2 className="text-xl font-bold">{c} <span className="ml-2 font-mono text-xs font-normal text-jade-bright">{items.filter((i) => i.category === c).length}</span></h2>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {items.filter((i) => i.category === c).map((p) => (
              <ProductCard key={p.slug} width={0} item={{ slug: p.slug, title: p.title, cover_url: p.cover_url, format: p.format, price: fmtPrice(p.price, region) }} />
            ))}
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="mt-14 text-muted">None yet. Check back soon.</p>}
    </div>
  );
}
