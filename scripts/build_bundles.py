"""Phase 2b: turn bundles.json (Entrepedia topic groupings) into branded bundles.

usage: python -I scripts/build_bundles.py
A bundle keeps only items that were successfully rebranded (so audio, which is left out for now, drops off).
Writes processed_assets/bundles_manifest.json and thumbnails/bundle-<slug>.jpg.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rebrand import OUT, ROOT, make_cover, slugify  # noqa: E402

MIN_ITEMS = 2


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    bundles = json.loads((ROOT / "bundles.json").read_text("utf-8"))
    ok = {r["id"]: r for r in json.loads((OUT / "manifest.json").read_text("utf-8")) if r.get("status") == "ok"}
    out, dropped = [], []
    for b in bundles:
        items = [ok[i["id"]] for i in b["items"] if i["id"] in ok]
        if len(items) < MIN_ITEMS:
            dropped.append(b["title"])
            continue
        title = re.sub(r"\s+-\s+(Ebook|Book)$", "", b["title"]).strip()
        slug = slugify(title)
        cat = Counter(i["category"] for i in items).most_common(1)[0][0]
        mix = ", ".join(f"{n} {f}" for f, n in Counter(i["format"] for i in items).most_common())
        desc = (f"Everything you need on {title}, in one purchase: {mix}.\n\n"
                "Included: " + "; ".join(i["title"] for i in items) + ".")
        cover = make_cover(title, f"Bundle · {len(items)} items", cat)
        thumb = f"bundle-{slug}.jpg"
        cover.resize((480, 640)).save(OUT / "thumbnails" / thumb, quality=85)
        out.append({"slug": slug, "title": title, "description": desc, "category": cat, "thumb": thumb,
                    "products": [i["slug"] for i in items]})
    (OUT / "bundles_manifest.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"bundles built: {len(out)}; dropped (<{MIN_ITEMS} rebranded items): {len(dropped)}")


if __name__ == "__main__":
    main()
