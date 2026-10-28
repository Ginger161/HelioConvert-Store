import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPaid, newReference, paystackLive, siteUrl, stackBundleIds } from "@/lib/orders";
import { stackBySlug } from "@/lib/stacks";

export async function POST(req: Request) {
  const form = await req.formData();
  const kind = String(form.get("kind"));
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || !["product", "bundle", "stack"].includes(kind)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let productId: string | null = null;
  let bundleId: string | null = null;
  let stackSlug: string | null = null;
  let amount: number;
  let currency: string;
  // price always read from the DB, never from the client
  if (kind === "product") {
    productId = String(form.get("productId"));
    const { data: p } = await db.from("products").select("price,currency").eq("id", productId).maybeSingle();
    if (!p) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
    amount = Number(p.price);
    currency = p.currency;
  } else if (kind === "stack") {
    const stack = stackBySlug(String(form.get("stackSlug")));
    if (!stack) return NextResponse.json({ error: "Unknown stack" }, { status: 404 });
    if ((await stackBundleIds(stack.slug)).length !== stack.steps.length) {
      return NextResponse.json({ error: "This stack is not available yet" }, { status: 409 }); // never sell a stack whose bundles aren't all live
    }
    stackSlug = stack.slug;
    amount = stack.price;
    currency = stack.currency;
  } else {
    bundleId = String(form.get("bundleId"));
    const { data: b } = await db.from("bundles").select("price,currency").eq("id", bundleId).maybeSingle();
    if (!b) return NextResponse.json({ error: "Unknown bundle" }, { status: 404 });
    amount = Number(b.price);
    currency = b.currency;
  }

  const reference = newReference();
  const { error } = await db.from("orders").insert({ email, kind, product_id: productId, bundle_id: bundleId, stack_slug: stackSlug, reference, amount, currency, status: "pending" });
  if (error) return NextResponse.json({ error: "Could not create order" }, { status: 500 });

  if (!paystackLive()) {
    // Test mode: instant access placeholder. Never allowed in production so files can't be given away by accident.
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
    await markPaid(reference);
    return NextResponse.redirect(`${siteUrl()}/orders/${reference}`, 303);
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: Math.round(amount * 100), currency, reference, callback_url: `${siteUrl()}/api/paystack/verify` }),
  });
  const json = await res.json();
  if (!json.status) return NextResponse.json({ error: json.message ?? "Payment init failed" }, { status: 502 });
  return NextResponse.redirect(json.data.authorization_url, 303);
}

