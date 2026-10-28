import "server-only";
import { randomUUID } from "crypto";
import { db } from "./db";
import { stackBySlug } from "./stacks";

export const newReference = () => `hc_${randomUUID().replace(/-/g, "")}`; // unguessable: doubles as the buyer's access token

export const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";
export const paystackLive = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

export async function paidOrder(reference: string) {
  const { data } = await db.from("orders").select("*").eq("reference", reference).eq("status", "paid").maybeSingle();
  return data as { id: string; kind: "product" | "bundle" | "stack"; product_id: string | null; bundle_id: string | null; stack_slug: string | null; email: string; reference: string } | null;
}

// The ids of every bundle a stack order covers (stack definitions live in lib/stacks.ts).
export async function stackBundleIds(stackSlug: string | null) {
  const stack = stackSlug ? stackBySlug(stackSlug) : undefined;
  if (!stack) return [];
  const { data } = await db.from("bundles").select("id,slug").in("slug", stack.steps.map((s) => s.bundle));
  const by = new Map((data ?? []).map((b) => [b.slug as string, b.id as string]));
  return stack.steps.map((s) => by.get(s.bundle)).filter(Boolean) as string[];
}

export async function markPaid(reference: string) {
  await db.from("orders").update({ status: "paid" }).eq("reference", reference);
}
