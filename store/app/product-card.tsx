import Link from "next/link";
import { objClass } from "@/lib/formats";

export type CardItem = { slug: string; title: string; cover_url: string | null; format: string | null; price: string };

/* eslint-disable @next/next/no-img-element */
export default function ProductCard({ item, width = 176 }: { item: CardItem; width?: number }) {
  return (
    <Link href={`/p/${item.slug}`} className="group block" style={width ? { width } : undefined}>
      <div className={`obj ${objClass(item.format)} glow-hover-img transition-transform duration-300 group-hover:-translate-y-1.5`}>
        {item.cover_url && <img src={item.cover_url} alt={item.title} loading="lazy" width={480} height={640} />}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-jade-bright">{item.format}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
      <p className="mt-1 text-sm text-gold">{item.price}</p>
    </Link>
  );
}
