"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useEscape, useScrollLock } from "./use-scroll-lock";
import { objClass } from "@/lib/formats";
import { POPULAR_SEARCHES, searchItems } from "@/lib/search";
import { fmtPrice } from "@/lib/region";
import { useRegion } from "./region-provider";

type Item = {
  id: string; title: string; slug: string; description: string | null; price: number; currency: string;
  cover_url: string | null; category: string | null; format: string | null;
};

const PAGE = 48;

export default function Catalog({ items, initialQ = "", initialFormat = "All" }: { items: Item[]; initialQ?: string; initialFormat?: string }) {
  const { region, t } = useRegion();
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState("All");
  const [fmt, setFmt] = useState(initialFormat);
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<Item | null>(null);
  const close = useCallback(() => setOpen(null), []);
  useScrollLock(open !== null);
  useEscape(open !== null, close);

  const cats = useMemo(() => ["All", ...[...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort()], [items]);
  const fmts = useMemo(() => ["All", ...[...new Set(items.map((i) => i.format).filter(Boolean) as string[])].sort()], [items]);
  const list = useMemo(
    () => searchItems(items.filter((i) => (cat === "All" || i.category === cat) && (fmt === "All" || i.format === fmt)), q),
    [items, q, cat, fmt],
  );

  const reset = () => setShown(PAGE);

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-5 py-16">
      <p className="font-mono text-xs text-jade">&gt; [SYS] {list.length} {t.indexed}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t.catalog}</h2>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); reset(); }}
          placeholder={t.search}
          className="glass w-full rounded-xl px-4 py-3 text-sm outline-none focus:border-jade sm:max-w-md"
        />
        <select value={fmt} onChange={(e) => { setFmt(e.target.value); reset(); }} className="glass rounded-xl bg-background px-4 py-3 text-sm">
          {fmts.map((f) => <option key={f} value={f}>{f === "All" ? t.allFormats : f}</option>)}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">Popular searches</span>
        {POPULAR_SEARCHES.map((s) => (
          <button key={s} onClick={() => { setQ(s); reset(); }} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 transition hover:border-jade-bright hover:text-jade-bright">{s}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => { setCat(c); reset(); }}
            className={`rounded-full border px-3 py-1 text-xs transition ${cat === c ? "border-jade bg-jade/20 text-foreground" : "border-line text-muted hover:text-foreground"}`}
          >
            {c === "All" ? t.all : c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {list.slice(0, shown).map((p) => (
          <button key={p.id} onClick={() => setOpen(p)} className="group text-left">
            <div className={`obj ${objClass(p.format)} transition-transform duration-300 group-hover:-translate-y-1.5`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.cover_url && <img src={p.cover_url} alt={p.title} loading="lazy" />}
            </div>
            <div className="pt-3">
              <p className="font-mono text-[10px] uppercase text-jade-bright">{p.format}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium">{p.title}</p>
              <p className="mt-2 text-sm text-gold">{fmtPrice(p.price, region)}</p>
            </div>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="mt-10 text-muted">{t.none}</p>}
      {shown < list.length && (
        <div className="mt-8 text-center">
          <button onClick={() => setShown((n) => n + PAGE)} className="glass rounded-full px-6 py-2 text-sm hover:border-jade">
            {t.showMore} ({list.length - shown} {t.left})
          </button>
        </div>
      )}

      {open && (
        // overscroll-contain: scrolling inside the card never chains through to the page; the page itself is locked (useScrollLock)
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/75 p-4 backdrop-blur-sm" onClick={close}
          role="dialog" aria-modal="true" aria-label={open.title}>
          <div className="edge relative max-h-[90vh] w-full max-w-3xl overflow-y-auto overscroll-contain p-5 sm:flex sm:gap-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <button onClick={close} aria-label={t.close} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white/10 hover:text-foreground">✕</button>
            <div className={`obj ${objClass(open.format)} mx-auto w-44 shrink-0 self-start sm:w-52`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {open.cover_url && <img src={open.cover_url} alt="" />}
            </div>
            <div className="mt-6 sm:mt-0">
              <p className="font-mono text-xs uppercase text-jade-bright">{open.category} · {open.format}</p>
              <h3 className="mt-1 pr-8 text-2xl font-semibold">{open.title}</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{open.description ?? ""}</p>
              <p className="mt-4 text-xl text-gold">{fmtPrice(open.price, region)}</p>
              <p className="text-xs text-muted">{t.note}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="kind" value="product" />
                  <input type="hidden" name="productId" value={open.id} />
                  <input required type="email" name="email" placeholder={t.email} className="glass mr-2 rounded-lg px-3 py-2 text-sm" />
                  <button className="btn-gold rounded-lg px-4 py-2 text-sm">{t.buy}</button>
                </form>
                <Link href={`/p/${open.slug}`} className="self-center text-sm text-muted underline">{t.fullPage}</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
