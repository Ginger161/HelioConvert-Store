"""Check that every product (and bundle) cover URL in the database really loads, and re-upload any that don't.

usage: python -I scripts/audit_covers.py [--fix]
"""
import concurrent.futures as cf
import json
import os
import sys
import time
import urllib.error
import urllib.request
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "processed_assets"
load_dotenv(ROOT / ".env")
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def retry(fn, tries=6):
    for k in range(tries):
        try:
            return fn()
        except Exception as e:
            if k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def page_all(table, cols):
    rows, s = [], 0
    while True:
        r = retry(lambda: sb.table(table).select(cols).range(s, s + 499).execute().data)
        rows += r
        if len(r) < 500:
            return rows
        s += 500


def status(url):
    for _ in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=25).status
        except urllib.error.HTTPError as e:
            return e.code
        except Exception:
            time.sleep(2)
    return "ERR"


if __name__ == "__main__":
    fix = "--fix" in sys.argv
    manifest = {r["slug"]: r for r in json.loads((OUT / "manifest.json").read_text("utf-8")) if r.get("status") == "ok"}
    bundles_manifest = {b["slug"]: b for b in json.loads((OUT / "bundles_manifest.json").read_text("utf-8"))}
    for table, source, label in (("products", manifest, "products"), ("bundles", bundles_manifest, "bundles")):
        rows = page_all(table, "slug,cover_url")
        with cf.ThreadPoolExecutor(12) as ex:
            codes = list(ex.map(lambda r: status(r["cover_url"]) if r["cover_url"] else "none", rows))
        bad = [(r["slug"], c) for r, c in zip(rows, codes) if c != 200]
        print(f"{label}: {len(rows)} in database, covers not loading: {len(bad)}", flush=True)
        for slug, c in bad[:10]:
            print("   ", slug, c)
        if fix and bad:
            fixed = 0
            for slug, _ in bad:
                src = source.get(slug)
                thumb = (src or {}).get("thumb")
                f = OUT / "thumbnails" / thumb if thumb else None
                if f and f.exists():
                    retry(lambda: sb.storage.from_("covers-public").upload(thumb, f.read_bytes(), {"content-type": "image/jpeg", "upsert": "true"}))
                    fixed += 1
            print(f"   re-uploaded {fixed} of {len(bad)}", flush=True)
