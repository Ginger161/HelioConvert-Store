import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markPaid, siteUrl } from "@/lib/orders";

// Paystack redirects the buyer here after payment. We re-verify server-side; the redirect alone proves nothing.
export async function GET(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference) return NextResponse.redirect(`${siteUrl()}/`, 303);

  const { data: order } = await db.from("orders").select("amount,currency").eq("reference", reference).maybeSingle();
  if (!order) return NextResponse.redirect(`${siteUrl()}/`, 303);

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const json = await res.json();
  const ok = json.status && json.data?.status === "success" && json.data.amount >= Math.round(Number(order.amount) * 100) && json.data.currency === order.currency;
  if (ok) await markPaid(reference);
  return NextResponse.redirect(`${siteUrl()}/orders/${reference}${ok ? "" : "?failed=1"}`, 303);
}
