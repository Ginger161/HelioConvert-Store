import Link from "next/link";
import { notFound } from "next/navigation";
import { allProducts } from "@/lib/db";
import { FORMATS } from "@/lib/formats";
import { goalBySlug, GOALS } from "@/lib/goals";
import { fmtPrice } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import ProductCard from "../../product-card";
import WithLoading from "../../page-loading";

const SHOWN = 12; // per format row; the full list lives on the format page and in the catalog

export function generateStaticParams() {
  return GOALS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = goalBySlug((await params).slug);
  return g ? { title: `${g.title} | HelioConvert`, description: g.hook } : {};
}

export default function GoalPage({ params }: { params: Promise<{ slug: string }> }) {
  return <WithLoading><GoalContent params={params} /></WithLoading>;
}

async function GoalContent({ params }: { params: Promise<{ slug: string }> }) {
  const goal = goalBySlug((await params).slug);
  if (!goal) notFound();
  const [all, region] = await Promise.all([allProducts(), getRegion()]);
  const items = all.filter((i) => goal.categories.includes(i.category ?? ""));
  const card = (p: (typeof items)[number]) => ({ slug: p.slug, title: p.title, cover_url: p.cover_url, format: p.format, price: fmtPrice(p.price, region) });

  return (
    <div className="mx-auto max-w-6xl py-14">
      <div className="px-5">
        <Link href="/#goals" className="text-xs text-muted hover:text-foreground">← All goals</Link>
        <p className="mt-6 font-mono text-xs text-gold">&gt; GOAL</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl"><span className="jade-text">{goal.title}</span></h1>
        <div className="glow-line mt-8 max-w-md" />
        <p className="mt-4 max-w-xl text-lg text-muted">{goal.hook}</p>
        <p className="mt-4 font-mono text-xs uppercase text-jade-bright">{items.length} courses · {goal.categories.join(" · ")}</p>
      </div>

      {FORMATS.map((f) => {
        const list = items.filter((i) => i.format === f.key);
        if (!list.length) return null;
        return (
          <div key={f.key} className="mt-14">
            <div className="flex items-end justify-between px-5">
              <div>
                <h2 className="text-2xl font-bold">{f.plural} <span className="ml-2 font-mono text-xs font-normal text-jade-bright">{list.length}</span></h2>
                <p className="mt-1 text-sm text-muted">{f.blurb}</p>
              </div>
              {list.length > SHOWN && <Link href={`/format/${f.slug}`} className="shrink-0 text-sm text-gold hover:underline">See all {list.length} →</Link>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 px-5 sm:grid-cols-3 lg:grid-cols-6">
              {list.slice(0, SHOWN).map((p) => <ProductCard key={p.slug} item={card(p)} width={0} />)}
            </div>
          </div>
        );
      })}
      {items.length === 0 && <p className="mt-14 px-5 text-muted">Courses for this goal are being added. Check back soon.</p>}
    </div>
  );
}
