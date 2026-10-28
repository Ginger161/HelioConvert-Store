import Link from "next/link";
import { notFound } from "next/navigation";
import { bundleBySlug, bundlesBySlugs } from "@/lib/db";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { abs, trim } from "@/lib/site";
import { stackBySlug, stackCover, STACKS } from "@/lib/stacks";
import JsonLd from "../../json-ld";
import WithLoading from "../../page-loading";
import StackCard from "../../stack-card";

/* eslint-disable @next/next/no-img-element */
export function generateStaticParams() {
  return STACKS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = stackBySlug((await params).slug);
  if (!s) return {};
  const description = trim(`${s.tagline} ${s.description}`);
  return {
    title: `${s.title}: ${s.steps.length} bundles to build your ${s.business} | HelioConvert Store`,
    description,
    alternates: { canonical: `/stack/${s.slug}` },
    openGraph: { type: "website", title: s.title, description, url: abs(`/stack/${s.slug}`), images: [abs(stackCover(s.slug))] },
    twitter: { card: "summary_large_image", title: s.title, description, images: [abs(stackCover(s.slug))] },
  };
}

export default function StackPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><StackContent params={params} /></WithLoading>;
}

const ORDER = ["Book", "Guide", "Mini-Course", "Checklist", "Listicle", "Prompt Pack", "Toolstack", "Notion Template"];

async function StackContent({ params }: { params: Promise<{ slug: string }> }) {
  const stack = stackBySlug((await params).slug);
  if (!stack) notFound();
  const slugs = stack.steps.map((s) => s.bundle);
  const [bundles, detail, region] = await Promise.all([bundlesBySlugs(slugs), Promise.all(slugs.map((s) => bundleBySlug(s))), getRegion()]);
  const t = strings(region.lang);
  const ready = bundles.length === stack.steps.length;
  const resources = bundles.reduce((n, b) => n + b.product_count, 0);
  const perStep = fmtPrice(Math.round(stack.price / stack.steps.length), region);
  const others = STACKS.filter((s) => s.slug !== stack.slug).slice(0, 3);
  const otherResources = await Promise.all(others.map(async (o) => (await bundlesBySlugs(o.steps.map((x) => x.bundle))).reduce((n, b) => n + b.product_count, 0)));
  const formatsOf = (slug: string) => {
    const set = new Set((detail[slugs.indexOf(slug)]?.items ?? []).map((i) => i.format).filter(Boolean) as string[]);
    return ORDER.filter((f) => set.has(f)).concat([...set].filter((f) => !ORDER.includes(f)));
  };

  return (
    <div className="bp" style={{ ["--bp" as string]: stack.accent }}>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: stack.title, description: stack.description, sku: `stack-${stack.slug}`,
        image: [abs(stackCover(stack.slug))], brand: { "@type": "Brand", name: "HelioConvert" },
        offers: { "@type": "Offer", url: abs(`/stack/${stack.slug}`), price: String(stack.price), priceCurrency: stack.currency, availability: ready ? "https://schema.org/InStock" : "https://schema.org/PreOrder" },
      }} />

      <section className="bp-bg relative overflow-hidden border-b border-dashed border-white/10">
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
            <Link href="/stacks" className="bp-mono hover:underline">← All business stacks</Link>
            <p className="bp-mono mt-6">Business stack · {stack.business}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">{stack.title}</h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">{stack.tagline}</p>
            <p className="bp-mono mt-8">You will leave with</p>
            <ul className="mt-3 space-y-2 text-sm">
              {stack.outcomes.map((o) => <li key={o} className="flex gap-3"><span style={{ color: stack.accent }}>◆</span><span>{o}</span></li>)}
            </ul>
            {/* on a phone the buy panel sits below all five steps, so surface the price and a jump link up here */}
            <a href="#buy" className="bp-btn mt-7 inline-block px-6 py-3 text-sm lg:hidden">{fmtPrice(stack.price, region)} · Start building ↓</a>
          </div>
          <img src={stackCover(stack.slug)} alt={`${stack.title}: the build path`} className="w-full rounded-md border border-dashed object-cover shadow-[0_30px_80px_-30px_var(--bp)]" style={{ borderColor: `${stack.accent}80` }} />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="bp-mono">The build path</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{stack.steps.length} steps, in the order you will need them</h2>
          <ol className="relative mt-10 space-y-8">
            <span className="bp-rail" aria-hidden />
            {stack.steps.map((s, i) => {
              const b = bundles.find((x) => x.slug === s.bundle);
              const formats = formatsOf(s.bundle);
              return (
                <li key={s.bundle} className="relative flex gap-5">
                  <span className="bp-node">{i + 1}</span>
                  <div className="min-w-0 pb-1">
                    <p className="bp-mono">Step {i + 1} · {s.role}</p>
                    <h3 className="mt-1 text-xl font-bold">{b ? <Link href={`/b/${b.slug}`} className="hover:underline">{b.title}</Link> : s.bundle}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.why}</p>
                    {formats.length > 0 && <p className="mt-3 flex flex-wrap gap-1.5">{formats.map((f) => <span key={f} className="bp-chip">{f}</span>)}</p>}
                    {b && <p className="mt-2 text-xs text-muted">{b.product_count} resources, one course in every format</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <aside id="buy" className="scroll-mt-24 lg:sticky lg:top-8 lg:self-start">
          <div className="bp-panel p-6">
            <p className="bp-mono">One-time · yours to keep</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">{fmtPrice(stack.price, region)}</p>
            <p className="mt-1 text-sm text-muted">about {perStep} per step · {stack.steps.length} bundles{resources ? ` · ${resources} resources` : ""}</p>
            <p className="mt-1 text-xs text-muted">{t.note}</p>
            {ready ? (
              <form action="/api/checkout" method="POST" className="mt-5 space-y-2">
                <input type="hidden" name="kind" value="stack" />
                <input type="hidden" name="stackSlug" value={stack.slug} />
                <input required type="email" name="email" placeholder={t.email} className="w-full rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[var(--bp)]" />
                <button className="bp-btn w-full px-6 py-3 text-sm">Start building</button>
              </form>
            ) : (
              <p className="mt-5 rounded-md border border-dashed border-white/20 px-4 py-3 text-sm text-muted">This stack opens as soon as all {stack.steps.length} bundles are live.</p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted">{t.instant} Prefer one step at a time? Every bundle in this stack is also sold on its own.</p>
          </div>
        </aside>
      </section>

      {others.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-24">
          <p className="bp-mono">Other businesses you can build</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {others.map((o, i) => <StackCard key={o.slug} stack={o} priceLabel={fmtPrice(o.price, region)} resources={otherResources[i] || undefined} />)}
          </div>
        </section>
      )}
    </div>
  );
}
