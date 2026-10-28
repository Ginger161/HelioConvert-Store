// A stack is a hand-picked path through several bundles, sold at one price well below buying them separately.
// The price lives here (server-side) and checkout reads it from here; the browser never sends a price.
export type StackStep = { bundle: string; role: string; why: string }; // bundle = bundle slug
export type Stack = {
  slug: string; title: string; tagline: string; description: string;
  price: number; currency: "NGN"; steps: StackStep[];
};

export const STACKS: Stack[] = [
  {
    slug: "business-stack",
    title: "Business Stack",
    tagline: "Take an idea to paying customers, in the order you'll actually need it.",
    description:
      "Five complete bundles that cover the whole journey of building a small business: get started, package what you know into an offer, get seen, sell consistently, and keep the cash flowing.",
    price: 33000,
    currency: "NGN",
    steps: [
      { bundle: "the-first-time-entrepreneur-launchpad", role: "Start", why: "Your first 90 days: idea, plan and first steps." },
      { bundle: "package-what-you-know-into-a-high-ticket-offer", role: "Package", why: "Turn what you know into something people pay well for." },
      { bundle: "content-marketing-for-small-businesses", role: "Attract", why: "Get found and trusted without a big budget." },
      { bundle: "turn-sales-into-predictable-growth", role: "Sell", why: "Move from lucky sales to a repeatable system." },
      { bundle: "the-cash-flow-system-for-small-businesses", role: "Keep", why: "Know your numbers so the business survives and grows." },
    ],
  },
];

export const stackBySlug = (slug: string) => STACKS.find((s) => s.slug === slug);
