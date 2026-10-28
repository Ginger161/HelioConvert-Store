import { allBundles, bundlesBySlugs } from "@/lib/db";
import { fmtPrice } from "@/lib/region";
import { getRegion } from "@/lib/region-server";
import { STACKS } from "@/lib/stacks";
import StackCard from "../stack-card";

export const metadata = {
  title: "Business Stacks: build a whole business, one step at a time | HelioConvert Store",
  description: "Each Business Stack is five bundles, in the order you need them, for building one particular business: an AI agency, an online store, a faceless content brand, an expert services business and more.",
  alternates: { canonical: "/stacks" },
};

export default async function Stacks() {
  const region = await getRegion();
  const [bundles, rows] = await Promise.all([
    allBundles(),
    Promise.all(STACKS.map(async (s) => ({ s, found: await bundlesBySlugs(s.steps.map((x) => x.bundle)) }))),
  ]);
  const bundlePrice = bundles.length ? Number(bundles[0].price) : 0;

  return (
    <>
      <section className="bp bp-bg relative overflow-hidden border-b border-dashed border-white/10">
        <div className="halo -right-20 -top-10 h-80 w-80 bg-sky-400/20" />
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <p className="bp-mono">&gt; Business stacks</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Pick the business you want to build.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Each stack is five bundles, in the order you will need them, for building one particular business. You get the whole path, not a pile of courses.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {rows.map(({ s, found }) => (
            <StackCard key={s.slug} stack={s} priceLabel={fmtPrice(s.price, region)} resources={found.reduce((n, b) => n + b.product_count, 0) || undefined} />
          ))}
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white/[0.03] p-7">
            <p className="font-mono text-[11px] uppercase text-gold">Bundle</p>
            <h2 className="mt-2 text-xl font-bold">One course, in every format</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">A bundle covers a single topic: the book, guides, checklist, mini-course and more, in one download.{bundlePrice ? ` ${fmtPrice(bundlePrice, region)} each.` : ""}</p>
          </div>
          <div className="bp bp-panel p-7" style={{ ["--bp" as string]: "#38bdf8" }}>
            <p className="bp-mono">Business stack</p>
            <h2 className="mt-2 text-xl font-bold">Five bundles, one business</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">A stack is a hand-picked path through five bundles, in order, for building one specific business from the first decision to steady income.</p>
          </div>
        </div>
      </section>
    </>
  );
}
