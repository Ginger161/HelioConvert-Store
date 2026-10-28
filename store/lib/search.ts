// Buyer-friendly search: every word must match somewhere, words are matched loosely (plurals, "income" ~ "money"),
// and results are ranked so a title hit beats a description hit.
const STOP = new Set(["a", "an", "the", "and", "or", "for", "to", "of", "in", "on", "with", "how", "my", "your", "i", "me", "is", "are", "that", "make", "get", "online", "best", "easy", "simple", "new", "can", "do", "want", "need", "way", "ways", "using", "start"]);

// What people type vs. what the titles say. Each group is interchangeable.
const SYNONYMS: string[][] = [
  ["money", "income", "earn", "revenue", "profit", "cash", "paid", "sales", "sell"],
  ["hustle", "freelanc", "gig", "income", "passive"],
  ["ai", "chatgpt", "gpt", "prompt", "automation", "automat", "agent", "llm"],
  ["stress", "anxiety", "burnout", "calm", "overwhelm"],
  ["mindfulness", "mindful", "meditation", "calm"],
  ["habit", "routine", "discipline", "consistency"],
  ["social", "instagram", "tiktok", "linkedin", "facebook", "youtube", "pinterest"],
  ["content", "post", "writing", "copywriting", "copy", "blog", "newsletter", "substack"],
  ["ecommerce", "e-commerce", "store", "shop", "shopify", "dropship"],
  ["startup", "founder", "entrepreneur", "business", "launch"],
  ["lead", "leads", "prospect", "outreach", "cold"],
  ["security", "cyber", "password", "privacy", "scam"],
  ["manager", "leadership", "team", "hiring", "hire"],
  ["fitness", "energy", "sleep", "health", "wellness", "wellbeing"],
  ["course", "lesson", "training", "learn", "tutorial"],
  ["checklist", "audit", "template"],
  ["book", "ebook", "e-book"],
];

const stem = (w: string) => (w.length > 4 && w.endsWith("ies") ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);

export function tokens(q: string) {
  return q.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
}

function expand(token: string) {
  const out = new Set([token]);
  for (const g of SYNONYMS) {
    if (g.some((s) => s === token || (token.length > 3 && s.length > 3 && (token.startsWith(s) || s.startsWith(token))))) g.forEach((s) => out.add(s));
  }
  return [...out];
}

// Short words ("ai", "seo") must match whole words, or "ai" would hit "email" and "maintain".
const has = (text: string, t: string) => (t.length <= 4 ? new RegExp(`\\b${t}`).test(text) : text.includes(t));

type Searchable = { title: string; description: string | null; category: string | null; format: string | null };

export function searchItems<T extends Searchable>(items: T[], q: string): T[] {
  const ts = tokens(q);
  if (!ts.length) return items;
  const groups = ts.map((t) => ({ t, alts: expand(t).filter((a) => a !== t) }));
  const scored: { item: T; score: number; i: number }[] = [];
  items.forEach((item, i) => {
    const title = item.title.toLowerCase();
    const meta = `${item.category ?? ""} ${item.format ?? ""}`.toLowerCase();
    const desc = (item.description ?? "").toLowerCase();
    let score = 0, matched = 0;
    for (const { t, alts } of groups) {
      let s = 0;
      if (has(title, t)) s = new RegExp(`\\b${t}`).test(title) ? 8 : 5;
      else if (has(meta, t)) s = 4;
      else if (has(desc, t)) s = 1.5;
      if (!s) for (const a of alts) { // synonym hits count, but less than the exact word
        if (has(title, a)) s = Math.max(s, 3);
        else if (has(meta, a)) s = Math.max(s, 2);
        else if (has(desc, a)) s = Math.max(s, 0.6);
      }
      if (s) { matched++; score += s; }
    }
    // short queries need every word; longer natural phrases ("side hustle income") need most of them
    if (matched < Math.ceil(ts.length * 0.6)) return;
    if (title.includes(ts.join(" "))) score += 6; // the whole phrase appears in the title
    score += (matched / ts.length) * 4; // reward items that satisfy more of the words
    scored.push({ item, score, i });
  });
  return scored.sort((a, b) => b.score - a.score || a.i - b.i).map((s) => s.item);
}

// Searches buyers actually make; the first six come from the Google Trends terms behind the Trending charts.
export const POPULAR_SEARCHES = ["AI automation", "side hustle", "freelancing", "passive income", "prompt engineering", "burnout", "habits", "e-commerce", "social media", "email course"];
