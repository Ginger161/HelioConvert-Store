import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paidOrder, stackBundleIds } from "@/lib/orders";

// GET /api/download/<productId>?ref=<order reference>
// Only paid orders get a link, and the link expires after 60 seconds.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  const order = ref ? await paidOrder(ref) : null;
  let allowed = false;
  if (order?.kind === "product") allowed = order.product_id === id;
  if (order?.kind === "bundle" && order.bundle_id) {
    const { data: hit } = await db.from("bundle_items").select("product_id").eq("bundle_id", order.bundle_id).eq("product_id", id).maybeSingle();
    allowed = Boolean(hit);
  }
  if (order?.kind === "stack") {
    const ids = await stackBundleIds(order.stack_slug);
    if (ids.length) {
      const { data: hit } = await db.from("bundle_items").select("product_id").in("bundle_id", ids).eq("product_id", id).limit(1);
      allowed = Boolean(hit?.length);
    }
  }
  if (!allowed) return NextResponse.json({ error: "No paid order for this file" }, { status: 403 });

  const { data: p } = await db.from("products").select("file_path").eq("id", id).maybeSingle();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await db.storage.from("books-secure").createSignedUrl(p.file_path, 60, { download: p.file_path });
  if (error || !data) return NextResponse.json({ error: "Could not sign URL" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 302);
}
