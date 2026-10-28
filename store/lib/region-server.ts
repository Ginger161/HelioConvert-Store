import "server-only";
import { cookies, headers } from "next/headers";
import { COUNTRY, CURRENCIES, DEFAULT_REGION, LANGS, type Lang, type Region } from "./region";

// Priority: the visitor's explicit choice (cookies) > country from the CDN geo header > Accept-Language > Naira/English.
export async function getRegion(): Promise<Region> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  const country = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  const accept = (h.get("accept-language") ?? "").slice(0, 2).toLowerCase();
  const geo = COUNTRY[country];
  const acceptLang = LANGS.find((l) => l.code === accept)?.code;

  const ck = c.get("hc_cur")?.value;
  const lk = c.get("hc_lang")?.value as Lang | undefined;
  return {
    currency: ck && CURRENCIES.includes(ck) ? ck : (geo?.currency ?? DEFAULT_REGION.currency),
    lang: lk && LANGS.some((l) => l.code === lk) ? lk : (geo?.lang !== "en" ? geo?.lang : undefined) ?? acceptLang ?? geo?.lang ?? "en",
  };
}
