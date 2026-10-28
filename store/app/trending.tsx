"use client";

import { useMemo, useState } from "react";
import type { Stat } from "@/lib/trending";
import ProductCard, { type CardItem } from "./product-card";

type Group = { label: string; months: string[]; series: Record<string, number[]> };
export type AngleView = { key: string; label: string; headline: string; reasons: string[]; stats: Stat[]; picks: CardItem[]; group: Group | null; search: string };
type Meta = { fetched: string | null; source: string; geo: string; window: string };

const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"];
const W = 720, H = 280, PL = 36, PR = 156, PT = 14, PB = 28;

const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en", { month: "short", year: "2-digit", timeZone: "UTC" });

function Chart({ group }: { group: Group }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const names = Object.keys(group.series);
  const n = group.months.length;
  const x = (i: number) => PL + (i / (n - 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / 100) * (H - PT - PB);

  const labels = useMemo(() => {
    // direct labels at the line ends, nudged apart so they never collide
    const items = names.map((name, k) => ({ name, k, y: y(group.series[name][n - 1]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 15) items[i].y = items[i - 1].y + 15;
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  if (table) {
    return (
      <div>
        <button onClick={() => setTable(false)} className="mb-3 text-xs text-jade-bright underline">Show chart</button>
        <div className="max-h-64 overflow-auto overscroll-contain rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-background"><tr><th className="p-2">Month</th>{names.map((nm) => <th key={nm} className="p-2">{nm}</th>)}</tr></thead>
            <tbody>
              {group.months.map((m, i) => (
                <tr key={m} className="border-t border-line"><td className="p-2 font-mono">{monthLabel(m)}</td>{names.map((nm) => <td key={nm} className="p-2">{Math.round(group.series[nm][i])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((px - PL) / (W - PL - PR)) * (n - 1)))));
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        {names.map((nm, k) => (
          <span key={nm} className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded" style={{ background: COLORS[k] }} />{nm}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" role="img" aria-label={`Search interest over five years for ${names.join(", ")}`}
        onPointerMove={move} onPointerLeave={() => setHover(null)}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" />
            <text x={PL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#94a09a">{v}</text>
          </g>
        ))}
        {[0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1].map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a09a">{monthLabel(group.months[i])}</text>
        ))}
        {names.map((nm, k) => (
          <polyline key={nm} className="chart-line" stroke={COLORS[k]} points={group.series[nm].map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
        ))}
        {labels.map((l) => (
          <text key={l.name} x={W - PR + 8} y={l.y + 3} fontSize="11" fill="#eef2ef">
            <tspan fill={COLORS[l.k]}>● </tspan>{l.name}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
            {names.map((nm, k) => <circle key={nm} cx={x(hover)} cy={y(group.series[nm][hover])} r="4.5" fill={COLORS[k]} stroke="#070b0a" strokeWidth="2" />)}
          </g>
        )}
      </svg>
      <div className="mt-1 flex min-h-12 flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-white/5 px-3 py-2 text-xs" aria-live="polite">
        {hover === null ? (
          <span className="text-muted">Hover the chart to read each month. Each line is scaled to its own peak (100), so you see the trend, not which topic is bigger.</span>
        ) : (
          <>
            <span className="font-mono text-muted">{monthLabel(group.months[hover])}</span>
            {names.map((nm, k) => <span key={nm}><span style={{ color: COLORS[k] }}>●</span> {nm} <b>{Math.round(group.series[nm][hover])}</b></span>)}
          </>
        )}
      </div>
      <button onClick={() => setTable(true)} className="mt-2 text-xs text-muted underline hover:text-foreground">View as table</button>
    </div>
  );
}

export default function Trending({ angles, meta }: { angles: AngleView[]; meta: Meta }) {
  const [active, setActive] = useState(angles[0].key);
  const a = angles.find((x) => x.key === active) ?? angles[0];
  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {angles.map((t) => (
          <button key={t.key} role="tab" aria-selected={t.key === active} onClick={() => setActive(t.key)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition ${t.key === active ? "border-gold bg-gold/15 text-gold shadow-[0_0_30px_-8px_var(--gold)]" : "border-line text-muted hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="edge p-6">
          <p className="font-mono text-[11px] uppercase text-jade-bright">Search interest · {meta.geo} · {meta.window}</p>
          {a.group ? (
            <div className="mt-4"><Chart key={a.key} group={a.group} /></div>
          ) : (
            <p className="mt-4 text-sm text-muted">The live search chart for this topic is on its way. The figures on the right are already sourced.</p>
          )}
          {meta.fetched && <p className="mt-3 text-[11px] text-muted">Source: {meta.source}, retrieved {meta.fetched}. Relative interest, not search volume.</p>}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-2xl font-bold leading-tight tracking-tight">{a.headline}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {a.stats.map((s) => (
              <div key={s.label} className="edge p-5">
                <p className="gold-text text-4xl font-extrabold tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-foreground/90">{s.label}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[11px] text-muted underline hover:text-jade-bright">{s.source} ↗</a>
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-sm text-muted">
            {a.reasons.map((r) => <li key={r} className="flex gap-3"><span className="mt-0.5 text-jade-bright">✓</span><span>{r}</span></li>)}
          </ul>
        </div>
      </div>

      {a.picks.length > 0 && (
        <>
          <div className="mt-14 flex items-end justify-between">
            <p className="font-mono text-xs text-gold">&gt; TOP PICKS FOR {a.label.toUpperCase()}</p>
            <a href={`/library?q=${encodeURIComponent(a.search)}`} className="text-sm text-gold hover:underline">See all →</a>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 sm:grid-cols-3 lg:grid-cols-6">
            {a.picks.map((p, i) => (
              <div key={p.slug} className="relative">
                <span className="rank">{i + 1}</span>
                <ProductCard item={p} width={0} />
              </div>
            ))}
          </div>
        </>
      )}
      <p className="mt-6 text-[11px] text-muted">Figures come from the reports linked above. They describe markets, not guaranteed results: what you earn depends on what you do with the material.</p>
    </div>
  );
}
