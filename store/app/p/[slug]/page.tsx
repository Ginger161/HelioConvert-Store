import Link from "next/link";
import { notFound } from "next/navigation";
import { allProducts, productBySlug } from "@/lib/db";
import { objClass } from "@/lib/formats";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { abs, AUTHOR, ORG_ID, PERSON_ID, SITE_NAME, trim } from "@/lib/site";
import JsonLd from "../../json-ld";
import WithLoading from "../../page-loading";
import ProductCard from "../../product-card";

type P = NonNullable<Awaited<ReturnType<typeof productBySlug>>>;

const seoTitle = (p: P) => `${p.title} (${p.format ?? "Course"}) | ${p.category ?? "Learn"} | HelioConvert`;
const seoDescription = (p: P) =>
  trim(p.description) || `${p.title}: a ${p.format?.toLowerCase() ?? "course"} on ${p.category?.toLowerCase() ?? "growth"} by ${AUTHOR}. Instant PDF download.`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await productBySlug(slug);
  if (!p) return {};
  return {
    title: seoTitle(p),
    description: seoDescription(p),
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { type: "website", title: p.title, description: seoDescription(p), url: abs(`/p/${p.slug}`), siteName: SITE_NAME, images: p.cover_url ? [p.cover_url] : undefined },
    twitter: { card: "summary_large_image", title: p.title, description: seoDescription(p), images: p.cover_url ? [p.cover_url] : undefined },
  };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><ProductContent params={params} /></WithLoading>;
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const [p, region, all] = await Promise.all([productBySlug((await params).slug), getRegion(), allProducts()]);
  if (!p) notFound();
  const t = strings(region.lang);
  const card = (x: (typeof all)[number]) => ({ slug: x.slug, title: x.title, cover_url: x.cover_url, format: x.format, price: fmtPrice(x.price, region) });
  const related = all.filter((x) => x.slug !== p.slug && x.category === p.category).slice(0, 6);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: p.title, description: seoDescription(p), sku: p.slug,
        image: p.cover_url ? [p.cover_url] : undefined, category: [p.category, p.format].filter(Boolean).join(" > "),
        brand: { "@type": "Brand", name: "HelioConvert" }, author: { "@id": PERSON_ID }, creator: { "@id": PERSON_ID },
        offers: { "@type": "Offer", seller: { "@id": ORG_ID }, url: abs(`/p/${p.slug}`), price: String(p.price), priceCurrency: p.currency, availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Library", item: abs("/library") },
          { "@type": "ListItem", position: 2, name: p.format ?? "Courses", item: abs(`/library?format=${encodeURIComponent(p.format ?? "")}`) },
          { "@type": "ListItem", position: 3, name: p.title, item: abs(`/p/${p.slug}`) },
        ],
      }} />
      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-16 md:grid-cols-[320px_1fr]">
        <div>
          <div className={`obj ${objClass(p.format)} mx-auto max-w-[300px]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.cover_url && <img src={p.cover_url} alt={`${p.title}: ${p.format ?? "course"} cover`} />}
          </div>
        </div>
        <div>
          <Link href={`/library?format=${encodeURIComponent(p.format ?? "")}`} className="font-mono text-xs uppercase text-jade-bright hover:underline">{p.format}</Link>
          <span className="font-mono text-xs uppercase text-muted"> · {p.category}</span>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">{p.title}</h1>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{p.description}</p>

          <div className="edge mt-8 p-6">
            <p className="gold-text text-3xl font-extrabold">{fmtPrice(p.price, region)}</p>
            <p className="mt-1 text-xs text-muted">{t.note}</p>
            <form action="/api/checkout" method="POST" className="mt-5 flex flex-wrap gap-2">
              <input type="hidden" name="kind" value="product" />
              <input type="hidden" name="productId" value={p.id} />
              <input required type="email" name="email" placeholder={t.email} className="min-w-0 flex-1 rounded-xl border border-line bg-black/30 px-4 py-3 text-sm outline-none focus:border-jade-bright" />
              <button className="btn-gold rounded-xl px-6 py-3 text-sm">{t.buy}</button>
            </form>
            <ul className="mt-5 space-y-1.5 text-xs text-muted">
              <li><span className="text-jade-bright">✓</span> {t.instant}</li>
              <li><span className="text-jade-bright">✓</span> PDF you keep forever; no account needed</li>
              <li><span className="text-jade-bright">✓</span> By <Link href="/about" className="hover:text-foreground hover:underline">{AUTHOR}</Link>, founder of HelioConvert</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <p className="font-mono text-xs text-gold">&gt; MORE IN {p.category?.toUpperCase()}</p>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((x) => <ProductCard key={x.slug} item={card(x)} width={0} />)}
          </div>
        </section>
      )}
    </>
  );
}
