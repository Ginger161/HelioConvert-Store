// Product formats: how each one is presented, so a book reads as a book and a checklist as a checklist.
export type FormatMeta = { key: string; slug: string; plural: string; blurb: string; obj: string; w: number };

export const FORMATS: FormatMeta[] = [
  { key: "Book", slug: "book", plural: "Books", blurb: "Deep, chapter-by-chapter mastery of a topic.", obj: "obj-book", w: 176 },
  { key: "Guide", slug: "guide", plural: "Guides", blurb: "Step-by-step walkthroughs you can finish in a weekend.", obj: "obj-guide", w: 176 },
  { key: "Mini-Course", slug: "mini-course", plural: "Mini-courses", blurb: "Multi-day email courses that build a skill lesson by lesson.", obj: "obj-minicourse", w: 176 },
  { key: "Checklist", slug: "checklist", plural: "Checklists", blurb: "Quick-win checklists: audit, fix, ship.", obj: "obj-checklist", w: 176 },
  { key: "Listicle", slug: "listicle", plural: "Listicles", blurb: "Short, punchy lists of mistakes, myths and moves.", obj: "obj-listicle", w: 176 },
  { key: "Prompt Pack", slug: "prompt-pack", plural: "Prompt packs", blurb: "Ready-to-use AI prompts that do the heavy lifting.", obj: "obj-promptpack", w: 176 },
  { key: "Toolstack", slug: "toolstack", plural: "Toolstacks", blurb: "Curated tool lineups for a specific job.", obj: "obj-toolstack", w: 176 },
];

export const objClass = (format: string | null) => FORMATS.find((f) => f.key === format)?.obj ?? "obj-guide";
