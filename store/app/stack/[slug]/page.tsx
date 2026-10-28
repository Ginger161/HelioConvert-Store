import Link from "next/link";
import { notFound } from "next/navigation";
import { bundlesBySlugs } from "@/lib/db";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { abs, trim } from "@/lib/site";
import { stackBySlug, STACKS } from "@/lib/stacks";
import JsonLd from "../../json-ld";
import WithLoading from "../../page-loading";

/* eslint-disable @next/next/no-img-element */
export function generateStaticParams() {
  return STACKS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = stackBySlug((await params).slug);
  if (!s) return {};
  const first = (await bundlesBySlugs([s.steps[0].bundle]))[0];
  return {
    title: `${s.title}: ${s.steps.length} bundles to build a business | HelioConvert`,
    description: trim(`${s.tagline} ${s.description}`),
    alternates: { canonical: `/stack/${s.slug}` },
    openGraph: { type: "website", title: s.title, description: s.tagline, url: abs(`/stack/${s.slug}`), images: first?.cover_url ? [first.cover_url] : undefined },
  };
}

export default function StackPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><StackContent params={params} /></WithLoading>;
}

async function StackContent({ params }: { params: Promise<{ slug: string }> }) {
  const stack = stackBySlug((await params).slug);
  if (!stack) notFound();
  const [bundles, region] = await Promise.all([bundlesBySlugs(stack.steps.map((s) => s.bundle)), getRegion()]);
  const t = strings(region.lang);
  const ready = bundles.length === stack.steps.length;
  const apart = bundles.reduce((n, b) => n + Number(b.price), 0);
  const saved = Math.max(0, apart - stack.price);
  const pct = apart ? Math.round((saved / apart) * 100) : 0;
  const resources = bundles.reduce((n, b) => n + b.product_count, 0);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: stack.title, description: stack.description, sku: `stack-${stack.slug}`,
        image: bundles[0]?.cover_url ? [bundles[0].cover_url] : undefined, brand: { "@type": "Brand", name: "HelioConvert" },
        offers: { "@type": "Offer", url: abs(`/stack/${stack.slug}`), price: String(stack.price), priceCurrency: stack.currency, availability: ready ? "https://schema.org/InStock" : "https://schema.org/PreOrder" },
      }} />
      <section className="relative overflow-hidden">
        <div className="rays pointer-events-none absolute inset-0 opacity-60" />
        <div className="halo -right-20 top-0 h-[360px] w-[360px] bg-gold/25" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-mono text-xs text-gold">&gt; BUNDLE STACK · {stack.steps.length} BUNDLES{resources ? ` · ${resources} RESOURCES` : ""}</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl"><span className="gold-text">{stack.title}</span></h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">{stack.tagline}</p>

            <div className="edge mt-8 max-w-md p-6">
              <p className="gold-text text-4xl font-extrabold">{fmtPrice(stack.price, region)}</p>
              {apart > stack.price && (
                <p className="mt-1 text-sm text-muted">
                  <span className="line-through">{fmtPrice(apart, region)}</span> if bought separately · <span className="font-semibold text-jade-bright">save {pct}%</span>
                </p>
              )}
              <p className="mt-1 text-xs text-muted">{t.note}</p>
              {ready ? (
                <form action="/api/checkout" method="POST" className="mt-5 flex flex-wrap gap-2">
                  <input type="hidden" name="kind" value="stack" />
                  <input type="hidden" name="stackSlug" value={stack.slug} />
                  <input required type="email" name="email" placeholder={t.email} className="min-w-0 flex-1 rounded-xl border border-line bg-black/30 px-4 py-3 text-sm outline-none focus:border-jade-bright" />
                  <button className="btn-gold rounded-xl px-6 py-3 text-sm">Get the stack</button>
                </form>
              ) : (
                <p className="mt-5 rounded-xl border border-line bg-black/30 px-4 py-3 text-sm text-muted">This stack opens as soon as all {stack.steps.length} bundles are live.</p>
              )}
              <p className="mt-3 text-xs text-muted">{t.instant} Every file stays yours to download again.</p>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[420px] w-[470px] lg:block">
            <div className="halo left-16 top-20 h-72 w-72 bg-jade-bright/20" />
            {bundles.map((b, i) => b.cover_url && (
              <img key={b.id} src={b.cover_url} alt={b.title} className="paper float-slow absolute w-40 rounded-xl"
                style={{ left: i * 68, top: 150 - Math.abs(i - 2) * 38 + (i % 2) * 8, zIndex: i, transform: `rotate(${(i - 2) * 6}deg)`, ["--r" as string]: `${(i - 2) * 6}deg`, animationDelay: `${i * 0.6}s` }} />
            ))}
          </div>
        </div>
        <div className="glow-line" />
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20">
        <p className="font-mono text-xs text-jade-bright">&gt; THE ROADMAP</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Five steps, in the order you&apos;ll need them</h2>
        <ol className="mt-12 space-y-4">
          {stack.steps.map((s, i) => {
            const b = bundles.find((x) => x.slug === s.bundle);
            return (
              <li key={s.bundle} className="edge relative flex gap-5 overflow-hidden p-5 sm:p-6">
                <span className="gold-text absolute -right-1 -top-5 text-8xl font-black opacity-15">{i + 1}</span>
                {b?.cover_url && <img src={b.cover_url} alt="" className="relative hidden h-28 w-[84px] shrink-0 rounded-lg object-cover shadow-lg sm:block" />}
                <div className="relative">
                  <p className="font-mono text-[11px] uppercase text-gold">Step {i + 1} · {s.role}</p>
                  <h3 className="mt-1 text-xl font-bold">
                    {b ? <Link href={`/b/${b.slug}`} className="hover:underline">{b.title}</Link> : s.bundle}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{s.why}</p>
                  {b && <p className="mt-2 font-mono text-[11px] uppercase text-jade-bright">{b.product_count} resources in this bundle</p>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-xs text-muted">Prefer to go one step at a time? Each bundle is also sold on its own.</p>
      </section>
    </>
  );
}
