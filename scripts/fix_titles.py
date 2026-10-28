"""Find products whose title is really a marketing tagline, re-brand them with the corrected title, and remove the
wrongly named copies from Supabase (their slug came from the bad title, so the new slug is a different row).

usage: python -I scripts/fix_titles.py [--apply-db]   (without --apply-db it only re-brands locally and writes old_slugs.json)
"""
import json, re, subprocess, sys, warnings
from pathlib import Path
warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rebrand import TAGLINE_RE  # noqa: E402

OUT = ROOT / "processed_assets"
man = {r["id"]: r for r in json.loads((OUT / "manifest.json").read_text("utf-8"))}
bad = [r for r in man.values() if r.get("status") == "ok" and (TAGLINE_RE.search(r["title"]) or len(r["title"]) > 75)]
old = OUT / "old_slugs.json"
if "--apply-db" not in sys.argv:
    olds = [{"id": r["id"], "slug": r["slug"], "file": r["file"], "thumb": r["thumb"]} for r in bad]
    old.write_text(json.dumps(olds, indent=1), encoding="utf-8")
    print(f"{len(bad)} bad titles:", [r["title"][:50] for r in bad])
    if bad:
        subprocess.run([sys.executable, "-I", str(ROOT / "scripts" / "rebrand.py"), "--force", "--ids", ",".join(r["id"][:8] for r in bad)], check=True)
    sys.exit()

# --apply-db: delete the stale rows and files, but only those whose slug really changed
from dotenv import load_dotenv
from supabase import create_client
import os
load_dotenv(ROOT / ".env")
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
new = {r["id"]: r for r in json.loads((OUT / "manifest.json").read_text("utf-8"))}
for o in json.loads(old.read_text("utf-8")):
    n = new.get(o["id"], {})
    if n.get("slug") and n["slug"] != o["slug"]:
        try:
            sb.table("products").delete().eq("slug", o["slug"]).execute()
            sb.storage.from_("books-secure").remove([o["file"]])
            sb.storage.from_("covers-public").remove([o["thumb"]])
            print("removed", o["slug"], "->", n["slug"])
        except Exception as e:
            print("COULD NOT remove", o["slug"], str(e)[:100])
    else:
        print("slug unchanged, kept:", o["slug"])
