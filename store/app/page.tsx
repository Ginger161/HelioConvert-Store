import Link from "next/link";
import assets from "@/lib/site-assets.json";
import trends from "@/lib/trends.json";
import { allBundles, allProducts } from "@/lib/db";
import { objClass } from "@/lib/formats";
import { GOALS } from "@/lib/goals";
import { fmtPrice, strings } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { ANGLES } from "@/lib/trending";
import { POPULAR_SEARCHES } from "@/lib/search";
import { type CardItem } from "./product-card";
import Trending, { type AngleView } from "./trending";

/* eslint-disable @next/next/no-img-element */
const floorTo = (n: number, step: number) => Math.floor(n / step) * step;

// Pick a varied set: round-robin across formats so a topic's top picks aren't six of the same thing.
function varied<T extends { format: string | null }>(list: T[], n: number) {
  const buckets = new Map<string, T[]>();
  for (const i of list) buckets.set(i.format ?? "", [...(buckets.get(i.format ?? "") ?? []), i]);
  const out: T[] = [];
  while (out.length < n && [...buckets.values()].some((b) => b.length)) {
    for (const b of buckets.values()) if (b.length && out.length < n) out.push(b.shift()!);
  }
  return out;
}

export default async function Home() {
  const [items, bundles, region] = await Promise.all([allProducts(), allBundles(), getRegion()]);
  const t = strings(region.lang);
  const { stats } = assets;
  const num = (n: number) => n.toLocaleString(region.lang);
  const topics = new Set(items.map((i) => i.category).filter(Boolean)).size;
  const cheapest = items.length ? Math.min(...items.map((i) => Number(i.price))) : 0;
  const metrics = [
    { value: `${num(floorTo(items.length || stats.products, 50))}+`, label: "courses, guides and checklists ready to use" },
    bundles.length >= 10 && { value: `${floorTo(bundles.length, 10)}+`, label: "complete topic bundles, every format in one download" },
    topics >= 5 && { value: `${topics}`, label: "topics, from AI and sales to wellness" },
    cheapest > 0 && { value: fmtPrice(cheapest, region), label: "to start, per course. No subscription" },
  ].filter((m): m is { value: string; label: string } => Boolean(m));
  const card = (p: (typeof items)[number]): CardItem => ({ slug: p.slug, title: p.title, cover_url: p.cover_url, format: p.format, price: fmtPrice(p.price, region) });

  const hero = ["Book", "Checklist", "Mini-Course"].map((f) => items.find((i) => i.format === f)).filter(Boolean);
  const groups = (trends as { groups: Record<string, AngleView["group"]> }).groups;
  // the newest month is still in progress, so its partial value would draw a false cliff at the end of every line
  const fetchedMonth = (trends as { fetched: string | null }).fetched?.slice(0, 7);
  const complete = (g: AngleView["group"]): AngleView["group"] => {
    if (!g || g.months[g.months.length - 1] !== fetchedMonth) return g;
    return { ...g, months: g.months.slice(0, -1), series: Object.fromEntries(Object.entries(g.series).map(([k, v]) => [k, v.slice(0, -1)])) };
  };
  const angles: AngleView[] = ANGLES.map((a) => ({
    key: a.key, label: a.label, search: a.search, headline: a.headline, reasons: a.reasons, stats: a.stats,
    group: complete(groups[a.key] ?? null),
    picks: varied(items.filter((i) => a.match.test(i.title)), 6).map(card),
  }));

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="rays pointer-events-none absolute inset-0 opacity-70" />
        <div className="halo -right-24 top-10 h-[420px] w-[420px] bg-gold/25" />
        <div className="halo -left-24 bottom-0 h-[380px] w-[380px] bg-jade/30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-16 md:grid-cols-[1.2fr_1fr] md:pt-24">
          <div>
            <p className="font-mono text-xs text-jade-bright">{t.kicker}</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
              {t.h1a}<br /><span className="jade-text">{t.h1b}</span><br /><span className="gold-text">{t.h1c}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted first-letter:uppercase">{t.lead}</p>

            <form action="/library" className="edge mt-8 flex max-w-xl items-center gap-2 p-2 pl-5">
              <input name="q" placeholder={'Try "AI side hustle" or "budget planner"'} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted" />
              <button className="btn-gold rounded-xl px-6 py-2.5 text-sm">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted">Popular</span>
              {POPULAR_SEARCHES.slice(0, 5).map((s) => (
                <Link key={s} href={`/library?q=${encodeURIComponent(s)}`} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 transition hover:border-jade-bright hover:text-jade-bright hover:shadow-[0_0_20px_-4px_var(--jade-bright)]">{s}</Link>
              ))}
            </div>
            <Link href="/start" className="group mt-6 inline-flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/[0.07] px-5 py-3 text-sm shadow-[0_0_40px_-14px_var(--gold)] transition hover:bg-gold/15">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-black">?</span>
              <span><span className="block font-semibold text-gold">Not sure what you need?</span><span className="block text-xs text-muted">Take the 1-minute quiz and we&apos;ll pick for you</span></span>
              <span className="text-gold transition group-hover:translate-x-1">→</span>
            </Link>
            <p className="mt-8 font-mono text-[11px] uppercase text-muted">
              Instant PDF download · pay in Naira · yours to keep
            </p>
          </div>

          <div className="relative mx-auto hidden h-[440px] w-[340px] md:block">
            <div className="halo left-10 top-24 h-72 w-72 bg-jade-bright/25" />
            {hero.map((p, i) => p && (
              <div key={p.slug} className={`obj ${objClass(p.format)} float-slow absolute w-52`}
                style={{ left: i * 56, top: i * 52, zIndex: i, transform: `rotate(${(i - 1) * 6}deg)`, ["--r" as string]: `${(i - 1) * 6}deg`, animationDelay: `${i * 0.9}s` }}>
                {p.cover_url && <img src={p.cover_url} alt={p.title} />}
              </div>
            ))}
          </div>
        </div>
        {/* what a buyer cares about: choice, completeness, range, and how little it costs to start */}
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 pb-14 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="border-l border-gold/40 pl-5">
              <p className="gold-text text-3xl font-extrabold tracking-tight sm:text-4xl">{m.value}</p>
              <p className="mt-1 text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="glow-line" />
      </section>

      {/* TRENDING */}
      <section id="trending" className="relative">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <p className="font-mono text-xs text-gold">&gt; TRENDING NOW</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">What people are searching for, and why it pays to learn it</h2>
          <p className="mt-3 max-w-xl text-muted">Real search trends and published research, with sources. Then the courses that teach it.</p>
          <div className="mt-12"><Trending angles={angles} meta={trends as never} /></div>
        </div>
        <div className="glow-line" />
      </section>

      {/* START HERE */}
      <section id="goals" className="mx-auto max-w-6xl px-5 py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-gold">&gt; NOT SURE WHERE TO START?</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Pick the outcome you want</h2>
          </div>
          <Link href="/library" className="btn-gold rounded-full px-6 py-2.5 text-sm">Browse the full catalog →</Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GOALS.map((g) => (
            <Link key={g.slug} href={`/goal/${g.slug}`} className="edge glow-hover group relative overflow-hidden p-5">
              <span className="gold-text absolute -right-2 -top-4 text-7xl font-black opacity-20 transition group-hover:opacity-45">{g.icon}</span>
              <p className="relative text-lg font-bold">{g.title}</p>
              <p className="relative mt-2 line-clamp-3 text-xs leading-relaxed text-muted">{g.hook}</p>
              <p className="relative mt-4 font-mono text-[11px] uppercase text-jade-bright">
                {items.filter((i) => g.categories.includes(i.category ?? "")).length} courses →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-6xl px-5 pb-28">
        <div className="edge relative flex flex-col items-center gap-8 overflow-hidden p-8 sm:flex-row sm:p-10">
          <div className="halo -left-10 -top-10 h-56 w-56 bg-gold/20" />
          <img src="/profile.jpg" alt="Ginger-Eke Chienyegom" className="relative h-32 w-32 shrink-0 rounded-full border-2 border-gold object-cover shadow-[0_0_50px_-6px_rgba(226,168,52,0.6)]" />
          <div className="relative">
            <p className="font-mono text-xs text-jade-bright">&gt; {t.aboutTitle.toUpperCase()}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.aboutBody}</p>
          </div>
        </div>
      </section>
    </>
  );
}
