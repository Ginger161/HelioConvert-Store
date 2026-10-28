"""Phase 3: push processed_assets/ to Supabase (storage + products table).

usage: python -I scripts/sync_to_db.py [--limit N]
Idempotent: files are upserted and products are upserted on slug, so reruns are safe.
"""
import argparse
import json
import mimetypes
import os
import sys
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
from dotenv import load_dotenv
from supabase import create_client

sys.path.insert(0, str(Path(__file__).resolve().parent))
from covers import clean_title  # noqa: E402
from descriptions import describe_record  # noqa: E402


def description_for(r):
    """Buyer-facing copy built from the product itself; falls back to the stored text only if the source files are unreadable."""
    try:
        return describe_record(r)
    except Exception:
        return r["description"]

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "processed_assets"
PRICE, CURRENCY = 3500, "NGN"
load_dotenv(ROOT / ".env")
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def ensure_buckets():
    have = {b.name for b in sb.storage.list_buckets()}
    for name, public in (("covers-public", True), ("books-secure", False)):
        if name not in have:
            sb.storage.create_bucket(name, options={"public": public})
            print("created bucket", name)


def table_ready():
    try:
        sb.table("products").select("id").limit(1).execute()
        return True
    except Exception:
        return False


def upload(bucket, path, local):
    ctype = mimetypes.guess_type(local.name)[0] or "application/octet-stream"
    for k in range(5):  # the connection drops now and then; back off and retry before giving up on a file
        try:
            return sb.storage.from_(bucket).upload(path, local.read_bytes(), {"content-type": ctype, "upsert": "true"})
        except Exception as e:
            if k == 4:
                raise
            print(f"  retry {k + 1} for {path}: {str(e)[:70]}", flush=True)
            time.sleep(5 * (k + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--shard", default="", help="K/N: upload every Nth product starting at K (run N processes in parallel)")
    ap.add_argument("--bundles-only", action="store_true")
    ap.add_argument("--descriptions-only", action="store_true", help="rewrite the description of every product already in the database")
    a = ap.parse_args()
    ensure_buckets()
    if not table_ready():
        sys.exit("products table missing: run scripts/schema.sql in the Supabase SQL Editor, then rerun.")
    if a.bundles_only:
        return sync_bundles()
    if a.descriptions_only:
        ok = [r for r in json.loads((OUT / "manifest.json").read_text("utf-8")) if r.get("status") == "ok"]
        for n, r in enumerate(ok, 1):
            try:
                sb.table("products").update({"description": description_for(r)}).eq("slug", r["slug"]).execute()
            except Exception as e:
                print(f"[{n}/{len(ok)}] FAILED {r['slug']}: {str(e)[:100]}", flush=True)
                continue
            if n % 100 == 0 or n == len(ok):
                print(f"[{n}/{len(ok)}] descriptions updated", flush=True)
        return
    recs = [r for r in json.loads((OUT / "manifest.json").read_text("utf-8")) if r.get("status") == "ok"]
    if a.limit:
        recs = recs[: a.limit]
    k, n = (int(x) for x in a.shard.split("/")) if a.shard else (0, 1)
    synced = OUT / (f"synced_s{k}.json" if a.shard else "synced.json")
    done = set()
    for f in OUT.glob("synced*.json"):  # any shard's finished work counts; old-cover state lives in synced_oldcovers.json
        if f.name != "synced_oldcovers.json":
            done |= set(json.loads(f.read_text(encoding="utf-8-sig")))  # utf-8-sig: tolerate a BOM if another tool rewrote the file
    done_mine = set(json.loads(synced.read_text(encoding="utf-8-sig"))) if synced.exists() else set()
    recs = [r for i, r in enumerate(recs) if i % n == k]
    for i, r in enumerate(recs, 1):
        if r["slug"] in done:
            continue
        try:
            upload("covers-public", r["thumb"], OUT / "thumbnails" / r["thumb"])
            upload("books-secure", r["file"], OUT / "pdfs" / r["file"])
            cover_url = sb.storage.from_("covers-public").get_public_url(r["thumb"])
            sb.table("products").upsert({
                "title": clean_title(r["title"]), "slug": r["slug"], "description": description_for(r), "price": PRICE, "currency": CURRENCY,
                "cover_url": cover_url, "file_path": r["file"], "category": r["category"],
                "subcategory": r.get("subcategory"), "format": r["format"],
            }, on_conflict="slug").execute()
        except Exception as e:  # leave it out of synced.json so the next run retries it
            print(f"[{i}/{len(recs)}] FAILED {r['slug']}: {str(e)[:120]}", flush=True)
            continue
        done_mine.add(r["slug"])
        synced.write_text(json.dumps(sorted(done_mine)))
        print(f"[{i}/{len(recs)}] synced {r['slug']}", flush=True)
    if not a.shard:
        sync_bundles()


BUNDLE_PRICE = 19500  # about USD 13


def sync_bundles():
    bpath = OUT / "bundles_manifest.json"
    if not bpath.exists():
        return print("no bundles_manifest.json yet; run build_bundles.py")
    try:
        sb.table("bundles").select("id").limit(1).execute()
    except Exception:
        return print("bundles table missing: run scripts/schema_bundles.sql in the Supabase SQL Editor, then rerun.")
    ids = {}
    for start in range(0, 100000, 1000):  # slug -> db id, paged past the 1000-row API default
        rows = sb.table("products").select("id,slug").range(start, start + 999).execute().data
        ids.update({r["slug"]: r["id"] for r in rows})
        if len(rows) < 1000:
            break
    for n, b in enumerate(json.loads(bpath.read_text("utf-8")), 1):
        upload("covers-public", b["thumb"], OUT / "thumbnails" / b["thumb"])
        members = [ids[s] for s in b["products"] if s in ids]
        if len(members) < 2:
            continue
        row = sb.table("bundles").upsert({
            "title": b["title"], "slug": b["slug"], "description": b["description"], "price": BUNDLE_PRICE, "currency": CURRENCY,
            "cover_url": sb.storage.from_("covers-public").get_public_url(b["thumb"]), "category": b["category"],
            "product_count": len(members),
        }, on_conflict="slug").execute().data[0]
        sb.table("bundle_items").delete().eq("bundle_id", row["id"]).execute()
        sb.table("bundle_items").insert([{"bundle_id": row["id"], "product_id": pid, "position": k} for k, pid in enumerate(members)]).execute()
        print(f"[bundle {n}] {b['slug']} ({len(members)} items)", flush=True)


if __name__ == "__main__":
    main()
