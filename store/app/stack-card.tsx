import Link from "next/link";
import { stackCover, type Stack } from "@/lib/stacks";

/* eslint-disable @next/next/no-img-element */
// The stack card is wide and blueprint-styled on purpose, so a stack never reads as a bundle.
export default function StackCard({ stack, resources, priceLabel, badge }: { stack: Stack; resources?: number; priceLabel: string; badge?: string }) {
  return (
    <Link href={`/stack/${stack.slug}`} className="bp bp-panel bp-card group block" style={{ ["--bp" as string]: stack.accent }}>
      <div className="relative overflow-hidden">
        <img src={stackCover(stack.slug)} alt={`${stack.title}: ${stack.steps.length} bundles to build a ${stack.business}`} loading="lazy" className="aspect-video w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        {badge && <span className="bp-mono absolute left-3 top-3 rounded bg-black/70 px-2 py-1 backdrop-blur">{badge}</span>}
      </div>
      <div className="p-5">
        <p className="bp-mono">Business stack · {stack.business}</p>
        <h3 className="mt-2 text-xl font-bold leading-snug">{stack.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{stack.tagline}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {stack.steps.map((s, i) => (
            <span key={s.bundle} className="inline-flex items-center gap-1.5">
              <span className="bp-chip">{s.role}</span>
              {i < stack.steps.length - 1 && <span className="text-[10px] text-muted">→</span>}
            </span>
          ))}
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-dashed border-white/10 pt-4">
          <span className="text-xl font-bold">{priceLabel}</span>
          <span className="bp-mono text-right">{stack.steps.length} bundles{resources ? ` · ${resources} resources` : ""} →</span>
        </div>
      </div>
    </Link>
  );
}
