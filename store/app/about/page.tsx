import Link from "next/link";
import { allBundles, allProducts } from "@/lib/db";
import { abs, AUTHOR, BIO, MAIN_SITE, PERSON_ID, SAME_AS, SITE_NAME } from "@/lib/site";
import { STACKS } from "@/lib/stacks";
import JsonLd from "../json-ld";
import WithLoading from "../page-loading";

export const metadata = {
  title: `${AUTHOR}: founder of HelioConvert, systems architect and software developer | ${SITE_NAME}`,
  description: `${AUTHOR} is a B2B digital systems architect, software developer and the founder of HelioConvert in Abuja, Nigeria. Learn what HelioConvert does and explore the HelioConvert Store of courses, books and bundles.`,
  alternates: { canonical: "/about" },
  openGraph: { type: "profile", title: `${AUTHOR}, founder of HelioConvert`, description: BIO, url: abs("/about"), images: [abs("/profile.jpg")] },
};

/* eslint-disable @next/next/no-img-element */
async function AboutContent() {
  const [items, bundles] = await Promise.all([allProducts(), allBundles()]);
  const stack = STACKS[0];
  // structured data must read the same for everyone, so prices here are always stated in Naira, from the live catalog
  const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;
  const cheapest = items.length ? Math.min(...items.map((i) => Number(i.price))) : 3500;
  const bundlePrice = bundles.length ? Number(bundles[0].price) : 19500;
  const faqs = [
    { q: `Who is ${AUTHOR}?`, a: `${BIO}` },
    { q: "What is HelioConvert?", a: `HelioConvert is an independent B2B Revenue Operations (RevOps) consultancy founded by ${AUTHOR} in Abuja, Nigeria. It builds lead-generation infrastructure, automated data pipelines, AI automations and software integrations for professional services. Its website is ${MAIN_SITE}.` },
    { q: "What is the HelioConvert Store?", a: `The HelioConvert Store (also written HelioConvrt Store) is the digital library of HelioConvert. It sells practical books, guides, mini-courses, checklists, prompt packs and topic bundles on business, AI, marketing, freelancing and wellbeing, written to be used straight away.` },
    { q: "How do the courses and bundles work?", a: `Everything is a PDF you can download instantly after paying, and you keep it. A bundle gathers one topic in every format (for example a book, guides, a checklist and a mini-course) into a single purchase. Prices are in Naira: single courses from ${ngn(cheapest)}, bundles ${ngn(bundlePrice)}.` },
    { q: `What is the ${stack.title}?`, a: `${stack.title} combines ${stack.steps.length} complete bundles in the order a small business needs them (start, package, attract, sell, keep) for ${ngn(stack.price)}, well below buying them separately.` },
  ];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "ProfilePage", "@id": abs("/about"), url: abs("/about"), name: `${AUTHOR}, founder of HelioConvert`,
        mainEntity: { "@id": PERSON_ID }, about: { "@id": PERSON_ID }, isPartOf: { "@id": abs("/#website") },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: SITE_NAME, item: abs("/") }, { "@type": "ListItem", position: 2, name: AUTHOR, item: abs("/about") }],
      }} />

      <section className="relative overflow-hidden">
        <div className="rays pointer-events-none absolute inset-0 opacity-50" />
        <div className="halo -right-16 top-0 h-80 w-80 bg-gold/20" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 md:grid-cols-[1fr_260px]">
          <div>
            <p className="font-mono text-xs text-jade-bright">&gt; ABOUT THE AUTHOR</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"><span className="gold-text">{AUTHOR}</span></h1>
            <p className="mt-3 text-lg text-foreground/90">Founder of HelioConvert · Systems Architect · Software Developer · Abuja, Nigeria</p>
            <p className="mt-5 max-w-xl leading-relaxed text-muted">{BIO}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <a href={MAIN_SITE} className="btn-gold rounded-xl px-5 py-2.5">Work with HelioConvert ↗</a>
              {SAME_AS.map((u) => (
                <a key={u} href={u} rel="me noopener noreferrer" target="_blank" className="rounded-xl border border-line px-5 py-2.5 text-muted hover:text-foreground">
                  {u.includes("linkedin") ? "LinkedIn" : "GitHub"} ↗
                </a>
              ))}
            </div>
          </div>
          <img src="/profile.jpg" alt={`${AUTHOR}, founder of HelioConvert`} className="mx-auto h-60 w-60 rounded-3xl border border-line object-cover shadow-[0_0_70px_-12px_rgba(226,168,52,0.45)]" />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-12 md:grid-cols-2">
        <div className="edge p-7">
          <p className="font-mono text-[11px] uppercase text-gold">What Ginger-Eke does</p>
          <h2 className="mt-2 text-2xl font-bold">HelioConvert: the consultancy</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            HelioConvert is an independent B2B Revenue Operations consultancy. It designs and deploys lead-generation infrastructure, automated data pipelines, AI automations and software integrations, and the systems that move prospects from first touch to booked call.
          </p>
          <a href={MAIN_SITE} className="mt-4 inline-block text-sm text-gold hover:underline">Visit helioconvrt.com ↗</a>
        </div>
        <div className="edge p-7">
          <p className="font-mono text-[11px] uppercase text-gold">What you&apos;re on now</p>
          <h2 className="mt-2 text-2xl font-bold">{SITE_NAME}: the courses</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The store is HelioConvert&apos;s digital library: {items.length ? `${Math.floor(items.length / 50) * 50}+` : "hundreds of"} books, guides, mini-courses, checklists and prompt packs{bundles.length >= 10 ? `, plus ${Math.floor(bundles.length / 10) * 10}+ complete topic bundles` : ""}, all as instant PDF downloads.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gold">
            <Link href="/library" className="hover:underline">Browse the catalog →</Link>
            <Link href="/start" className="hover:underline">Take the quiz →</Link>
            <Link href={`/stack/${stack.slug}`} className="hover:underline">{stack.title} →</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24">
        <p className="font-mono text-xs text-jade-bright">&gt; QUESTIONS</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">About {AUTHOR} and the store</h2>
        <dl className="mt-8 divide-y divide-line">
          {faqs.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

export default function About() {
  return <WithLoading><AboutContent /></WithLoading>;
}
