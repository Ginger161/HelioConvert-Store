"use client";

import { useEffect } from "react";

// While a modal or drawer is open, the page behind it must not scroll. Scrollbars are hidden site-wide, so locking
// overflow causes no layout shift. A counter keeps it correct if two overlays are ever open at once.
let locks = 0;
let saved: { html: string; body: string } | null = null;

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    if (locks++ === 0) {
      saved = { html: html.style.overflow, body: body.style.overflow };
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    }
    return () => {
      if (--locks === 0 && saved) {
        html.style.overflow = saved.html;
        body.style.overflow = saved.body;
        saved = null;
      }
    };
  }, [active]);
}

// Escape closes the overlay; one place so every modal behaves the same.
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}
