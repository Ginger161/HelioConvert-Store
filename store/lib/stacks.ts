// A Business Stack is a group of BUNDLES (a bundle is one course in every format) that together help someone build one
// particular business, such as an AI agency or an online store. The data lives in stacks.json so the website and the
// cover generator (scripts/stack_covers.py) read the same source. The price here is what checkout charges; the browser
// never sends a price.
import data from "./stacks.json";

export type StackStep = { bundle: string; role: string; why: string }; // bundle = bundle slug
export type Stack = {
  slug: string; title: string; business: string; tagline: string; description: string;
  outcomes: string[]; price: number; currency: "NGN"; accent: string; tags: string[]; steps: StackStep[];
};

export const STACKS = data as unknown as Stack[];
export const stackBySlug = (slug: string) => STACKS.find((s) => s.slug === slug);
export const stackCover = (slug: string) => `/stacks/${slug}.jpg`;
export const stackPriceRange = () => {
  const p = STACKS.map((s) => s.price);
  return { min: Math.min(...p), max: Math.max(...p) };
};
