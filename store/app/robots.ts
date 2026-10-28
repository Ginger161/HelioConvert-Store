import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

const PRIVATE = ["/api/", "/orders/", "/start/results"]; // order pages are private; quiz results are personal

// Search engines and the crawlers behind AI answer engines are all welcome: being quoted accurately is the goal.
// To opt out of AI *training* crawlers later, move GPTBot / ClaudeBot / Google-Extended / Applebot-Extended / CCBot to disallow.
const AI_AND_SEARCH_BOTS = ["Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_AND_SEARCH_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
