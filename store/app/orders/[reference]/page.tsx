import { db } from "@/lib/db";
import { paidOrder, stackBundleIds } from "@/lib/orders";

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await paidOrder(reference);

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold">Payment not confirmed</h1>
        <p className="mt-3 text-muted">If you were charged, refresh in a minute or contact us with reference <code className="font-mono">{reference}</code>.</p>
      </div>
    );
  }

  let items: { id: string; title: string; format: string | null }[] = [];
  if (order.kind === "stack") {
    const ids = await stackBundleIds(order.stack_slug);
    const { data } = await db.from("bundle_items").select("bundle_id, position, products(id,title,format)").in("bundle_id", ids).order("position");
    const rank = new Map(ids.map((id, i) => [id, i])); // keep the stack's own order: step 1's files first
    const rows = (data ?? []).sort((a, b) => (rank.get(a.bundle_id) ?? 0) - (rank.get(b.bundle_id) ?? 0) || a.position - b.position);
    const seen = new Set<string>();
    items = rows.map((r) => (Array.isArray(r.products) ? r.products[0] : r.products)).filter((p): p is (typeof items)[number] => Boolean(p) && !seen.has(p!.id) && !!seen.add(p!.id));
  } else if (order.kind === "bundle") {
    const { data } = await db.from("bundle_items").select("position, products(id,title,format)").eq("bundle_id", order.bundle_id!).order("position");
    items = (data ?? []).map((r) => (Array.isArray(r.products) ? r.products[0] : r.products)).filter(Boolean) as typeof items;
  } else {
    const { data } = await db.from("products").select("id,title,format").eq("id", order.product_id!);
    items = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="font-mono text-xs text-jade">&gt; [SYS] payment confirmed</p>
      <h1 className="mt-2 text-3xl font-semibold">Your downloads</h1>
      <p className="mt-2 text-sm text-muted">Bookmark this page. Each click generates a fresh secure link that expires in 60 seconds.</p>
      <ul className="mt-8 divide-y divide-line">
        {(items ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm">{p.title} <span className="font-mono text-xs text-muted">{p.format}</span></span>
            <a href={`/api/download/${p.id}?ref=${reference}`} className="rounded-lg bg-jade-bright px-4 py-1.5 text-sm font-semibold text-black">Download</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
