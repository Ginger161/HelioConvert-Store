// "Where do you want to start?": beginner-friendly goals, each mapped from the library's own categories.
export type Goal = { slug: string; title: string; hook: string; icon: string; categories: string[] };

export const GOALS: Goal[] = [
  {
    slug: "make-money", title: "Make money", icon: "₦",
    hook: "Offers, sales, freelancing and online income, from first client to steady revenue.",
    categories: ["Digital Marketing", "Lead Generation", "Paid Ads", "Sales", "E-commerce", "Freelancing", "Solopreneur", "Startups", "Creator Economy", "Finance"],
  },
  {
    slug: "grow-online", title: "Grow an audience", icon: "◎",
    hook: "Content, social media, branding and video that get you seen and remembered.",
    categories: ["Content Creation", "Social Media", "Branding", "Video and Podcast"],
  },
  {
    slug: "learn-tech", title: "Learn AI & tech", icon: "⌘",
    hook: "AI, automation, security and tools that save time and open higher-paying skills.",
    categories: ["AI", "Automation", "Cybersecurity", "Tech Tools", "Systems and Productivity"],
  },
  {
    slug: "wellbeing", title: "Feel better", icon: "✺",
    hook: "Habits, energy, mindset and wellness routines you can actually keep.",
    categories: ["Wellness", "Habits", "Energy", "Mindset", "Parenting", "Personal Growth", "Personal Development"],
  },
  {
    slug: "lead", title: "Lead & manage", icon: "▲",
    hook: "Leadership and team skills for the next step in your career.",
    categories: ["Leadership", "Special Topics"],
  },
];

export const goalBySlug = (slug: string) => GOALS.find((g) => g.slug === slug);
