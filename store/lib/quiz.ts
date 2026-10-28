// The "what should I get?" quiz: questions, how answers map to the library, and the keywords used to rank matches.
export type Option = { value: string; label: string; hint?: string };
export type Question = { key: "stage" | "goal" | "time" | "style" | "scope"; title: string; sub: string; options: Option[] };

export const QUESTIONS: Question[] = [
  {
    key: "stage", title: "Which best describes you right now?", sub: "This helps us pitch things at the right level.",
    options: [
      { value: "starter", label: "I'm just starting out and need direction" },
      { value: "side", label: "I have a job and want extra income or a new skill" },
      { value: "owner", label: "I run a business and want to grow it" },
      { value: "self", label: "I want to improve myself, my habits or my wellbeing" },
    ],
  },
  {
    key: "goal", title: "What do you want most in the next 90 days?", sub: "Pick the one that matters most.",
    options: [
      { value: "money", label: "Make money (first income, or more of it)" },
      { value: "audience", label: "Get seen and grow an audience" },
      { value: "tech", label: "Learn AI and tech skills" },
      { value: "wellbeing", label: "Feel better: habits, energy, calm" },
      { value: "lead", label: "Lead better and move up at work" },
    ],
  },
  {
    key: "time", title: "How much time can you give it each week?", sub: "Be honest. We'll match the size of the material.",
    options: [
      { value: "lt2", label: "Under 2 hours", hint: "Short, quick wins" },
      { value: "2to5", label: "2 to 5 hours" },
      { value: "5to10", label: "5 to 10 hours" },
      { value: "10plus", label: "10+ hours", hint: "I'm all in" },
    ],
  },
  {
    key: "style", title: "How do you like to learn?", sub: "We'll lead with the format that suits you.",
    options: [
      { value: "quick", label: "Quick checklists and short lists" },
      { value: "steps", label: "Step-by-step guides I can follow" },
      { value: "email", label: "A day-by-day mini-course" },
      { value: "deep", label: "A full book I can go deep in" },
      { value: "prompts", label: "AI prompts that do the work for me" },
    ],
  },
  {
    key: "scope", title: "What would help you most?", sub: "One last question.",
    options: [
      { value: "one", label: "One focused resource to start with" },
      { value: "topic", label: "A complete bundle on one topic" },
      { value: "business", label: "The full path to build a business" },
    ],
  },
];

export type Answers = Record<Question["key"], string>;

export const labelFor = (key: Question["key"], value: string) =>
  QUESTIONS.find((q) => q.key === key)?.options.find((o) => o.value === value)?.label ?? value;

export const parseAnswers = (sp: Record<string, string | string[] | undefined>): Answers => {
  const pick = (q: Question) => {
    const v = Array.isArray(sp[q.key]) ? (sp[q.key] as string[])[0] : (sp[q.key] as string | undefined);
    return q.options.some((o) => o.value === v) ? (v as string) : q.options[0].value;
  };
  return Object.fromEntries(QUESTIONS.map((q) => [q.key, pick(q)])) as Answers;
};

// Short phrases for sentences like "It suits X" (the option labels read badly mid-sentence).
export const STYLE_PHRASE: Record<string, string> = {
  quick: "quick checklists and short lists", steps: "step-by-step guides", email: "a day-by-day mini-course", deep: "going deep in a full book", prompts: "AI prompts that do the work",
};
export const GOAL_PHRASE: Record<string, string> = {
  money: "making money", audience: "growing an audience", tech: "learning AI and tech", wellbeing: "feeling better", lead: "leading better",
};

// Which library goal (see lib/goals.ts) each answer to "what do you want most" points at.
export const GOAL_SLUG: Record<string, string> = { money: "make-money", audience: "grow-online", tech: "learn-tech", wellbeing: "wellbeing", lead: "lead" };

// Words used to rank bundles and courses inside the chosen goal, sharpened by where the person is starting from.
export const QUERY: Record<string, Record<string, string>> = {
  money: { starter: "start launch first income freelancing side hustle", side: "side hustle freelancing passive income offer", owner: "sales pricing offer customers growth", self: "income money habits" },
  audience: { starter: "content beginner social audience", side: "content creator audience monetize", owner: "content marketing brand social proof", self: "content audience confidence" },
  tech: { starter: "AI beginner prompt automation", side: "AI automation skill prompt", owner: "AI automation business chatbot", self: "AI learning productivity" },
  wellbeing: { starter: "habit routine mindful stress", side: "habit energy sleep stress", owner: "burnout stress founder balance", self: "habit mindful wellness sleep calm" },
  lead: { starter: "leader manager team", side: "leadership confidence negotiation", owner: "hire team manager leadership", self: "leader emotional intelligence" },
};

// Preferred formats: the way they like to learn first, then what their available time suggests.
export const STYLE_FORMATS: Record<string, string[]> = {
  quick: ["Checklist", "Listicle"], steps: ["Guide"], email: ["Mini-Course"], deep: ["Book"], prompts: ["Prompt Pack", "Toolstack"],
};
export const TIME_FORMATS: Record<string, string[]> = {
  lt2: ["Checklist", "Listicle"], "2to5": ["Guide", "Mini-Course"], "5to10": ["Mini-Course", "Book"], "10plus": ["Book", "Mini-Course"],
};
