import Link from "next/link";
import { Suspense } from "react";
import { allBundles, allProducts, bundlesBySlugs } from "@/lib/db";
import { objClass } from "@/lib/formats";
import { goalBySlug } from "@/lib/goals";
import { GOAL_PHRASE, GOAL_SLUG, labelFor, parseAnswers, QUERY, QUESTIONS, STYLE_FORMATS, STYLE_PHRASE, TIME_FORMATS } from "@/lib/quiz";
import { fmtPrice } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { searchItems } from "@/lib/search";
import { STACKS } from "@/lib/stacks";
import ProductCard from "../../product-card";

export const metadata = { title: "Your picks | HelioConvert", robots: { index: false, follow: true } };

/* eslint-disable @next/next/no-img-element */
type Hero = { eyebrow: string; title: string; body: string; href: string; cta: string; price: string; covers: { src: string; obj: string }[] };

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const a = parseAnswers(await searchParams);
  const [products, bundles, region] = await Promise.all([allProducts(), allBundles(), getRegion()]);
  const goal = goalBySlug(GOAL_SLUG[a.goal])!;
  const query = QUERY[a.goal]?.[a.stage] ?? "";
  const price = (n: number) => fmtPrice(n, region);

  // bundles inside the chosen goal, ranked by the words that fit this person's starting point
  const pool = bundles.filter((b) => goal.categories.includes(b.category ?? ""));
  const rankedBundles = searchItems((pool.length ? pool : bundles).map((b) => ({ ...b, format: "Bundle" })), query);
  const bundle = rankedBundles[0] ?? pool[0];
  const altBundle = rankedBundles[1];

  // courses: relevance first, then nudged toward the way they like to learn and the time they have
  const inGoal = products.filter((p) => goal.categories.includes(p.category ?? ""));
  const relevant = searchItems(inGoal, query);
  const base = relevant.length >= 3 ? relevant : inGoal;
  const tier = (f: string | null) => (STYLE_FORMATS[a.style]?.includes(f ?? "") ? 0 : TIME_FORMATS[a.time]?.includes(f ?? "") ? 1 : 2);
  const picks = base.map((p, i) => ({ p, i })).sort((x, y) => tier(x.p.format) - tier(y.p.format) || x.i - y.i).slice(0, 4).map((x) => x.p);

  const stack = STACKS[0];
  const stackBundles = await bundlesBySlugs(stack.steps.map((s) => s.bundle));
  const stackReady = stackBundles.length === stack.steps.length;
  const wantsStack = stackReady && (a.scope === "business" || (a.goal === "money" && ["starter", "owner"].includes(a.stage)));

  const bundleHero = (b: NonNullable<typeof bundle>): Hero => ({
    eyebrow: `Your bundle · ${b.product_count} resources`, title: b.title, href: `/b/${b.slug}`, cta: "See what's inside", price: price(b.price),
    body: `A complete topic in one purchase. It matches what you want (${GOAL_PHRASE[a.goal]}) and fits where you are right now.`,
    covers: b.cover_url ? [{ src: b.cover_url, obj: "obj-guide" }] : [],
  });
  const courseHero = (p: (typeof picks)[number]): Hero => ({
    eyebrow: `Your starting point · ${p.format}`, title: p.title, href: `/p/${p.slug}`, cta: "View this course", price: price(p.price),
    body: `A focused ${p.format?.toLowerCase()} you can start today. It fits ${STYLE_PHRASE[a.style]} and the time you have.`,
    covers: p.cover_url ? [{ src: p.cover_url, obj: objClass(p.format) }] : [],
  });
  const stackHero = (): Hero => ({
    eyebrow: `Your path · ${stack.steps.length} bundles`, title: stack.title, href: `/stack/${stack.slug}`, cta: "See the roadmap", price: price(stack.price),
    body: `${stack.tagline} Five bundles in the order you'll need them, at a fraction of buying them one by one.`,
    covers: stackBundles.slice(0, 3).map((b) => ({ src: b.cover_url!, obj: "obj-guide" })),
  });

  const hero: Hero | null = a.scope === "business" && stackReady ? stackHero() : a.scope === "one" && picks[0] ? courseHero(picks[0]) : bundle ? bundleHero(bundle) : picks[0] ? courseHero(picks[0]) : null;
  const heroIsBundle = hero && bundle && hero.href === `/b/${bundle.slug}`;
  const shownPicks = picks.filter((p) => hero?.href !== `/p/${p.slug}`).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="font-mono text-xs text-jade-bright">&gt; YOUR PICKS</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Here&apos;s what we&apos;d start with</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Because you told us</span>
        {QUESTIONS.map((q) => <span key={q.key} className="rounded-full border border-line bg-white/[0.03] px-3 py-1">{labelFor(q.key, a[q.key])}</span>)}
      </div>

      {hero && (
        <div className="edge relative mt-10 grid gap-8 overflow-hidden p-6 sm:p-10 md:grid-cols-[1fr_260px]">
          <div className="halo -left-16 -top-16 h-72 w-72 bg-gold/20" />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase text-gold">{hero.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{hero.title}</h2>
            <p className="mt-4 max-w-lg text-muted">{hero.body}</p>
            <p className="gold-text mt-6 text-3xl font-extrabold">{hero.price}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={hero.href} className="btn-gold rounded-xl px-7 py-3 text-sm">{hero.cta} →</Link>
              <Link href="/start" className="rounded-xl border border-line px-6 py-3 text-sm text-muted hover:text-foreground">Retake the quiz</Link>
            </div>
          </div>
          <div className="relative mx-auto flex h-72 w-56 items-center justify-center">
            <div className="halo left-6 top-10 h-48 w-48 bg-jade-bright/25" />
            {hero.covers.map((c, i, all) => (
              <div key={c.src} className={`obj ${c.obj} absolute w-40`} style={{ left: all.length > 1 ? i * 34 : 28, top: all.length > 1 ? i * 26 : 20, zIndex: i, transform: `rotate(${(i - (all.length - 1) / 2) * 7}deg)` }}>
                <img src={c.src} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}

      {shownPicks.length > 0 && (
        <section className="mt-16">
          <p className="font-mono text-xs text-gold">&gt; {hero?.href.startsWith("/p/") ? "MORE LIKE IT" : "OR START SMALLER"}</p>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {shownPicks.map((p) => <ProductCard key={p.slug} width={0} item={{ slug: p.slug, title: p.title, cover_url: p.cover_url, format: p.format, price: price(p.price) }} />)}
          </div>
        </section>
      )}

      {(altBundle || (!heroIsBundle && bundle)) && (
        <section className="mt-16">
          <p className="font-mono text-xs text-gold">&gt; {hero?.href.startsWith("/b/") ? "ANOTHER BUNDLE YOU MIGHT LIKE" : "WANT THE WHOLE TOPIC?"}</p>
          <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {[!heroIsBundle ? bundle : null, altBundle].filter((b): b is NonNullable<typeof b> => Boolean(b)).slice(0, 2).map((b) => (
              <Link key={b.id} href={`/b/${b.slug}`} className="edge glow-hover overflow-hidden">
                {b.cover_url && <img src={b.cover_url} alt={b.title} className="aspect-[3/4] w-full object-cover" />}
                <div className="p-3">
                  <p className="font-mono text-[10px] uppercase text-gold">Bundle · {b.product_count} items</p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium">{b.title}</p>
                  <p className="mt-1 text-sm font-semibold text-gold">{price(b.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {wantsStack && hero?.href !== `/stack/${stack.slug}` && (
        <Link href={`/stack/${stack.slug}`} className="edge glow-hover relative mt-16 flex flex-col gap-4 overflow-hidden p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="halo -right-10 -top-10 h-56 w-56 bg-gold/25" />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase text-gold">Building a business?</p>
            <p className="mt-1 text-2xl font-bold">The {stack.title}: {stack.steps.length} bundles for {price(stack.price)}</p>
            <p className="mt-1 text-sm text-muted">{stack.tagline}</p>
          </div>
          <span className="btn-gold relative shrink-0 rounded-xl px-6 py-3 text-sm">See the roadmap →</span>
        </Link>
      )}
    </div>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-6xl px-5 py-16 font-mono text-xs text-jade">&gt; [SYS] matching your answers…</div>}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}
