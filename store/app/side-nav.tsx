"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useEscape, useScrollLock } from "./use-scroll-lock";
import { FORMATS } from "@/lib/formats";
import { GOALS } from "@/lib/goals";
import { fmtPrice } from "@/lib/region";
import { MAIN_SITE } from "@/lib/site";
import { STACKS } from "@/lib/stacks";
import { RegionSwitcher, useRegion } from "./region-provider";

const ICONS = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  trend: "M3 17l6-6 4 4 8-9M15 6h6v6",
  library: "M5 4h4v16H5zM11 4h4v16h-4zM17 6l3 1-3.5 13-3-1z",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  star: "M12 2l2.8 6.3 6.7.6-5 4.5 1.5 6.6L12 16.5 6 20l1.5-6.6-5-4.5 6.7-.6z",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

function Item({ href, icon, children, active, onClick }: { href: string; icon?: keyof typeof ICONS; children: React.ReactNode; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 ${icon ? "py-2" : "py-1.5"} text-sm transition ${active ? "bg-white/10 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_0_24px_-10px_var(--jade-bright)]" : "text-muted hover:bg-white/5 hover:text-foreground"}`}>
      {icon && <span className={active ? "text-jade-bright" : "group-hover:text-jade-bright"}><Icon name={icon} /></span>}
      <span className="truncate">{children}</span>
    </Link>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <p className="mb-1.5 mt-5 px-3 font-mono text-[10px] uppercase tracking-widest text-muted/70">{children}</p>;

function Panel({ close }: { close?: () => void }) {
  const path = usePathname();
  const { region, t } = useRegion();
  const stack = STACKS[0];
  const is = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={close} className="flex items-center gap-3 px-3 pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/emblem.png" alt="" className="h-9 w-9 drop-shadow-[0_0_14px_rgba(61,220,151,0.5)]" />
        <span className="leading-tight"><span className="block font-semibold tracking-tight">HelioConvert</span><span className="block font-mono text-[10px] text-jade-bright">/ store</span></span>
      </Link>

      <form action="/library" onSubmit={close} className="mt-5 px-1">
        <input name="q" placeholder="Search library" aria-label="Search library"
          className="w-full rounded-xl border border-line bg-white/[0.04] px-4 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-jade-bright focus:shadow-[0_0_24px_-8px_var(--jade-bright)]" />
      </form>

      {/* scrollbars are hidden site-wide, so the bottom edge fades to hint that this list scrolls */}
      <nav aria-label="Main" className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 [mask-image:linear-gradient(to_bottom,#000_90%,transparent)]">
        <Label>Library</Label>
        <Item href="/" icon="home" active={is("/")} onClick={close}>Home</Item>
        <Item href="/#trending" icon="trend" active={false} onClick={close}>Trending</Item>
        <Item href="/library" icon="library" active={is("/library")} onClick={close}>{t.catalog}</Item>
        <Item href="/bundles" icon="layers" active={is("/bundles") || is("/b")} onClick={close}>{t.bundles}</Item>
        <Item href="/stacks" icon="star" active={is("/stacks") || is("/stack")} onClick={close}>Bundle stacks</Item>
        <Item href="/about" icon="home" active={is("/about")} onClick={close}>About Ginger-Eke</Item>

        <Label>Not sure where to start?</Label>
        <Link href="/start" onClick={close}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${is("/start") ? "border-gold bg-gold/15 text-gold" : "border-gold/40 bg-gold/[0.07] text-gold hover:bg-gold/15"} shadow-[0_0_30px_-12px_var(--gold)]`}>
          <Icon name="compass" /> Take the quiz <span className="ml-auto font-mono text-[10px] font-normal opacity-70">1 min</span>
        </Link>
        <div className="mt-2">
          {GOALS.map((g) => <Item key={g.slug} href={`/goal/${g.slug}`} active={is(`/goal/${g.slug}`)} onClick={close}>{g.title}</Item>)}
        </div>

        <Label>Formats</Label>
        {FORMATS.map((f) => <Item key={f.slug} href={`/format/${f.slug}`} active={is(`/format/${f.slug}`)} onClick={close}>{f.plural}</Item>)}
      </nav>

      <div className="space-y-3 border-t border-line pt-4">
        <Link href={`/stack/${stack.slug}`} onClick={close} className="edge glow-hover relative block overflow-hidden p-4">
          <div className="halo -right-6 -top-6 h-24 w-24 bg-gold/30" />
          <p className="relative font-mono text-[10px] uppercase text-gold">{stack.steps.length} bundles · one path</p>
          <p className="relative mt-1 font-bold">{stack.title}</p>
          <p className="relative text-sm text-gold">{fmtPrice(stack.price, region)}</p>
        </Link>
        <div className="flex items-center justify-between px-1">
          <RegionSwitcher />
          <a href={MAIN_SITE} className="text-xs text-muted hover:text-foreground">{t.mainSite} ↗</a>
        </div>
      </div>
    </div>
  );
}

export default function SideNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const closeMenu = useCallback(() => setOpen(false), []);
  useEffect(() => setOpen(false), [path]);
  useScrollLock(open); // the page must not scroll behind the open menu
  useEscape(open, closeMenu);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-[#060a09]/85 p-4 backdrop-blur-xl lg:block">
        <Panel />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblem.png" alt="" className="h-8 w-8" />
          <span className="font-semibold tracking-tight">HelioConvert</span>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-xl border border-line">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-[#060a09] p-4 shadow-[20px_0_60px_-10px_rgba(0,0,0,0.9)]">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-foreground">✕</button>
            <Panel close={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
