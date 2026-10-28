"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, LANGS, strings, type Lang, type Region, type Strings } from "@/lib/region";

const Ctx = createContext<{ region: Region; t: Strings }>({ region: { currency: "NGN", lang: "en" }, t: strings("en") });
export const useRegion = () => useContext(Ctx);

export function RegionProvider({ region, children }: { region: Region; children: React.ReactNode }) {
  useEffect(() => { document.documentElement.lang = region.lang; }, [region.lang]); // <html lang> is static in the layout
  return <Ctx.Provider value={{ region, t: strings(region.lang) }}>{children}</Ctx.Provider>;
}

export function RegionSwitcher() {
  const { region, t } = useRegion();
  const router = useRouter();
  const set = (k: string, v: string) => {
    document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className="flex items-center gap-1 text-xs" aria-label={t.region}>
      <select value={region.currency} onChange={(e) => set("hc_cur", e.target.value)} className="rounded-md border border-line bg-background px-1.5 py-1">
        {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select value={region.lang} onChange={(e) => set("hc_lang", e.target.value as Lang)} className="rounded-md border border-line bg-background px-1.5 py-1">
        {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </div>
  );
}
