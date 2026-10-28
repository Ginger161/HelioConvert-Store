import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  cover_url: string | null;
  file_path: string;
  category: string | null;
  subcategory: string | null;
  format: string | null;
  created_at: string;
};

export type Bundle = {
  id: string; title: string; slug: string; description: string | null; price: number; currency: string;
  cover_url: string | null; category: string | null; product_count: number;
};
export type BundleItem = Pick<Product, "id" | "title" | "slug" | "format" | "cover_url" | "price" | "currency">;

export const BUNDLE_PRICE_NGN = 19500; // about USD 13; the DB row is the source of truth at checkout
export const ONE_OFF_PRICE_NGN = 3500;

// Service-role client: server-only (see `server-only` import). Never expose to the browser.
export const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const PUBLIC_COLUMNS = "id,title,slug,description,price,currency,cover_url,category,subcategory,format,created_at";

export async function allProducts(): Promise<Omit<Product, "file_path">[]> {
  "use cache";
  cacheLife("minutes"); // the catalog changes only when sync_to_db.py runs
  const rows: Omit<Product, "file_path">[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("products").select(PUBLIC_COLUMNS).order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as never[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

const BUNDLE_COLUMNS = "id,title,slug,description,price,currency,cover_url,category,product_count";

// Bundles tolerate a missing table (schema_bundles.sql not run yet) so the rest of the site still works.
export async function allBundles(): Promise<Bundle[]> {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await db.from("bundles").select(BUNDLE_COLUMNS).order("title");
  return error ? [] : (data as Bundle[]);
}

export async function bundleBySlug(slug: string): Promise<(Bundle & { items: BundleItem[] }) | null> {
  "use cache";
  cacheLife("minutes");
  const { data: b } = await db.from("bundles").select(BUNDLE_COLUMNS).eq("slug", slug).maybeSingle();
  if (!b) return null;
  const { data: rows } = await db.from("bundle_items").select("position, products(id,title,slug,format,cover_url,price,currency)").eq("bundle_id", b.id).order("position");
  const items = (rows ?? []).map((r) => (Array.isArray(r.products) ? r.products[0] : r.products) as BundleItem).filter(Boolean);
  return { ...(b as Bundle), items };
}

// The bundles behind a stack, in the stack's own order. Missing bundles are skipped so a page never crashes on a typo.
export async function bundlesBySlugs(slugs: string[]): Promise<Bundle[]> {
  "use cache";
  cacheLife("minutes");
  const { data } = await db.from("bundles").select(BUNDLE_COLUMNS).in("slug", slugs);
  const by = new Map((data ?? []).map((b) => [b.slug as string, b as Bundle]));
  return slugs.map((s) => by.get(s)).filter(Boolean) as Bundle[];
}

export async function productBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  const { data } = await db.from("products").select(PUBLIC_COLUMNS).eq("slug", slug).maybeSingle();
  return data as Omit<Product, "file_path"> | null;
}

