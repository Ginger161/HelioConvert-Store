import Link from "next/link";
import { bundlesBySlugs } from "@/lib/db";
import { fmtPrice } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { STACKS } from "@/lib/stacks";

export const metadata = { title: "Bundle Stacks | HelioConvert", description: "Several complete bundles combined into one path, at one price well below buying them separately.", alternates: { canonical: "/stacks" } };

/* eslint-disable @next/next/no-img-element */
export default async function Stacks() {
  const region = await getRegion();
  const rows = await Promise.all(STACKS.map(async (s) => ({ s, bundles: await bundlesBySlugs(s.steps.map((x) => x.bundle)) })));
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-mono text-xs text-gold">&gt; STACKS</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl"><span className="gold-text">Bundle stacks</span></h1>
      <p className="mt-3 max-w-xl text-muted">A stack combines several complete bundles into one path, so you can build something real without piecing it together yourself.</p>
      <div className="mt-12 grid gap-6">
        {rows.map(({ s, bundles }) => {
          const apart = bundles.reduce((n, b) => n + Number(b.price), 0);
          return (
            <Link key={s.slug} href={`/stack/${s.slug}`} className="edge glow-hover group relative flex flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="halo -left-10 -top-10 h-56 w-56 bg-gold/20" />
              <div className="relative flex shrink-0 -space-x-6">
                {bundles.map((b, i) => b.cover_url && <img key={b.id} src={b.cover_url} alt="" className="paper h-36 w-[108px] rounded-lg object-cover" style={{ transform: `rotate(${(i - 2) * 4}deg)` }} />)}
              </div>
              <div className="relative">
                <p className="font-mono text-[11px] uppercase text-gold">{s.steps.length} bundles</p>
                <h2 className="mt-1 text-2xl font-bold">{s.title}</h2>
                <p className="mt-1 max-w-md text-sm text-muted">{s.tagline}</p>
                <p className="mt-3 text-lg font-semibold text-gold">
                  {fmtPrice(s.price, region)}
                  {apart > s.price && <span className="ml-3 text-sm font-normal text-muted line-through">{fmtPrice(apart, region)}</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
