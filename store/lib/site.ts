// Set NEXT_PUBLIC_SITE_URL in the deployed environment (store/.env.production sets it to the store subdomain).
// Canonical links, the sitemap, llms.txt and structured data all use it; localhost only suits local development.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000").replace(/\/$/, "");
export const SITE_NAME = "HelioConvert Store";
export const AUTHOR = "Ginger-Eke Chienyegom";
export const abs = (path: string) => `${SITE_URL}${path}`;

// The main site (helioconvrt.com) already publishes these two entities. The store reuses the exact same @ids so
// search engines and AI systems merge them into one: the person, the company, and now the store.
export const MAIN_SITE = "https://helioconvrt.com";
export const ORG_ID = `${MAIN_SITE}/#organization`;
export const PERSON_ID = `${MAIN_SITE}/#founder`;
export const ORG_LOGO = `${MAIN_SITE}/press/helioconvert-logo.webp`;
export const SAME_AS = [
  "https://www.linkedin.com/in/chienyegom-ginger-eke-677b6a2a6/",
  "https://github.com/Ginger161",
];

// Wording taken from helioconvrt.com so every page describes the same person and company the same way.
export const BIO =
  "Ginger-Eke Chienyegom is a B2B digital systems architect, software developer, and the founder of HelioConvert, based in Abuja, Nigeria. Ginger-Eke engineers lead generation infrastructure, AI automations, and software integrations for professional services.";
export const ORG_DESCRIPTION =
  "HelioConvert is an independent B2B Revenue Operations (RevOps) consultancy founded by Ginger-Eke Chienyegom, building lead-generation infrastructure, automated data pipelines and AI automations.";
export const STORE_DESCRIPTION =
  "HelioConvert Store is the digital library of HelioConvert, founded by Ginger-Eke Chienyegom: practical books, guides, mini-courses, checklists, prompt packs and bundles on business, AI, marketing and wellbeing, delivered as instant PDF downloads.";

export const trim = (s: string | null | undefined, n = 155) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, "")}…`;
};
