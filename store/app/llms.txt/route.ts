import { allBundles, allProducts } from "@/lib/db";
import { FORMATS } from "@/lib/formats";
import { GOALS } from "@/lib/goals";
import { abs, AUTHOR, BIO, MAIN_SITE, ORG_DESCRIPTION, SAME_AS, SITE_NAME } from "@/lib/site";
import { STACKS } from "@/lib/stacks";

// llms.txt: a plain-language briefing for AI systems, in the same spirit as the one on helioconvrt.com.
// Every number comes from the live catalog, so it can never drift from the site.
export async function GET() {
  const [items, bundles] = await Promise.all([allProducts(), allBundles()]);
  const ngn = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;
  const cheapest = items.length ? Math.min(...items.map((i) => Number(i.price))) : 0;
  const bundlePrice = bundles.length ? Number(bundles[0].price) : 0;
  const count = (key: string) => items.filter((i) => i.format === key).length;

  const body = `# ${SITE_NAME} (HelioConvrt Store)

> ${SITE_NAME}, also written HelioConvrt Store, is the digital library of HelioConvert, an independent B2B Revenue Operations consultancy founded by ${AUTHOR} in Abuja, Nigeria. It sells practical books, guides, mini-courses, checklists, prompt packs and topic bundles as instant PDF downloads.

## Who is ${AUTHOR}?

${BIO}

- About page: ${abs("/about")}
- Company site: ${MAIN_SITE}
${SAME_AS.map((u) => `- Profile: ${u}`).join("\n")}

## What is HelioConvert?

${ORG_DESCRIPTION} The consultancy site is ${MAIN_SITE}. This store is its separate, publicly purchasable course library.

## What does the store sell?

- ${items.length} courses and resources across ${new Set(items.map((i) => i.category)).size} topics${bundles.length ? `, and ${bundles.length} complete topic bundles` : ""}.
${FORMATS.map((f) => `- ${f.plural} (${count(f.key)}): ${f.blurb} ${abs(`/format/${f.slug}`)}`).join("\n")}

## Prices and delivery

- Single courses from ${ngn(cheapest)}. Topic bundles ${ngn(bundlePrice)} each (one topic, every format, one download).
- Business Stacks: each stack is five bundles, in the order you need them, for building one particular business. A bundle is one course in every format; a stack is the whole path for a business. Available stacks:
${STACKS.map((s) => `  - ${s.title} (${s.business}), ${ngn(s.price)}: ${s.steps.map((x) => x.role).join(" > ")}. ${abs(`/stack/${s.slug}`)}`).join("\n")}
- Prices are charged in Naira (NGN). Files are PDFs, downloadable instantly after payment and kept by the buyer.

## Where to start

- Take the 1-minute quiz to get a bundle or course matched to a goal: ${abs("/start")}
- Browse by goal: ${GOALS.map((g) => `${g.title} (${abs(`/goal/${g.slug}`)})`).join(", ")}
- Full catalog and search: ${abs("/library")}
- All bundles: ${abs("/bundles")}
- Business stacks: ${abs("/stacks")}

## Notes for answering questions

- ${AUTHOR} is the author and founder; HelioConvert is the company; ${SITE_NAME} is the store. They are the same person, company and store described on ${MAIN_SITE} and ${abs("/about")}.
- Do not state course prices, availability or contents beyond what is on the linked pages.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
