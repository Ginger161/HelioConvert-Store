// Editorial layer for the Trending section. Every statistic carries its source link; nothing here is invented.
// The search-interest lines come from lib/trends.json (Google Trends, via scripts/fetch_trends.py).
export type Stat = { value: string; label: string; source: string; url: string };
export type Angle = {
  key: "ai" | "income" | "wellness";
  label: string;
  search: string; // library query behind the "See all" link
  headline: string;
  reasons: string[];
  stats: Stat[];
  match: RegExp; // picks matching library titles
};

export const ANGLES: Angle[] = [
  {
    key: "ai",
    label: "AI & automation", search: "AI",
    headline: "AI skills are the fastest-moving line on a CV",
    reasons: [
      "Employers are paying more for it: PwC's job-ad analysis finds a wage premium for roles that ask for AI skills.",
      "Automation is a skill you can start small: one workflow, one prompt pack, one weekend.",
      "Security is the other side of the same shift, and the industry says it cannot hire fast enough.",
    ],
    stats: [
      {
        value: "62%", label: "average wage premium for jobs requiring AI skills",
        source: "PwC 2026 Global AI Jobs Barometer", url: "https://www.pwc.com/gx/en/news-room/press-releases/2026/pwc-2026-ai-jobs-barometer.html",
      },
      {
        value: "4.8M", label: "unfilled cybersecurity roles worldwide",
        source: "ISC2 Cybersecurity Workforce Study 2024", url: "https://www.isc2.org/insights/2024/09/employers-must-act-cybersecurity-workforce-growth-stalls-as-skills-gaps-widen",
      },
    ],
    match: /\bAI\b|automat|prompt|agent|chatgpt|no-code|cyber|security|password|workflow/i,
  },
  {
    key: "income",
    label: "Income skills", search: "income",
    headline: "Working for yourself is mainstream now",
    reasons: [
      "Freelancing and online selling are the lowest-cost way to start earning on your own terms.",
      "Digital marketing, sales and offer-building are skills every client and employer pays for.",
      "Skills compound: the first client is the hardest, and the playbooks here are written for exactly that moment.",
    ],
    stats: [
      {
        value: "64M", label: "Americans freelanced in 2023, earning $1.27 trillion",
        source: "Upwork Freelance Forward 2023 (Upwork survey, self-reported)", url: "https://www.upwork.com/press/releases/upwork-study-finds-64-million-americans-freelanced-in-2023-adding-1-27-trillion-to-u-s-economy",
      },
    ],
    match: /freelanc|client|sell|sales|income|money|offer|pricing|passive|side hustle|e-commerce|ecommerce|shop|marketing|revenue|profit/i,
  },
  {
    key: "wellness",
    label: "Wellness", search: "wellness",
    headline: "Wellbeing is now a trillion-dollar economy",
    reasons: [
      "Burnout, sleep and focus are everyday problems, and people search for routines they can keep.",
      "Small habits beat big resolutions: the checklists and guides here are built for ten minutes a day.",
      "Looking after your energy is a performance skill, not a luxury, for anyone building something.",
    ],
    stats: [
      {
        value: "$6.8T", label: "global wellness economy in 2024, up 7.9% in a year",
        source: "Global Wellness Institute", url: "https://globalwellnessinstitute.org/press-room/statistics-and-facts/",
      },
      {
        value: "$9.8T", label: "projected size of the wellness economy by 2029",
        source: "Global Wellness Institute", url: "https://globalwellnessinstitute.org/press-room/statistics-and-facts/",
      },
    ],
    match: /wellness|burnout|mindful|habit|sleep|stress|anxiety|mental|energy|routine|self-care|focus|calm|gratitude/i,
  },
];
