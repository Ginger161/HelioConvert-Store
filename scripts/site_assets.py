"""Build homepage proof assets from the real library: stats, cover images and sample interior pages.

usage: python -I scripts/site_assets.py        (rerun after the batch finishes to refresh the numbers)
Writes store/lib/site-assets.json and store/public/samples/{covers,pages}/*.jpg
"""
import json
import re
import shutil
import sys
import warnings
from collections import defaultdict
from pathlib import Path

warnings.filterwarnings("ignore")
import pymupdf

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / "raw_assets", ROOT / "processed_assets"
SITE = ROOT / "store"
FORMATS = ["Book", "Guide", "Mini-Course", "Checklist", "Listicle", "Prompt Pack"]


def num_after(lines, label):
    if label in lines:
        i = lines.index(label)
        m = re.fullmatch(r"[\d,]+", lines[i + 1]) if i + 1 < len(lines) else None
        if m:
            return int(m.group().replace(",", ""))
    return None


def stats():
    pages = words = counted = 0
    by_fmt = defaultdict(lambda: {"count": 0, "pages": 0, "words": 0, "n": 0})
    total = 0
    for d in RAW.iterdir():
        mp = d / "meta.json"
        if not mp.exists():
            continue
        meta = json.loads(mp.read_text("utf-8"))
        fmt = meta.get("contains") or "Other"
        if fmt not in FORMATS + ["Toolstack"]:  # audio is not sold yet; also drops a scrape glitch label
            continue
        total += 1
        f = by_fmt[fmt]
        f["count"] += 1
        lines = [l.strip() for l in meta.get("description", "").split("\n")]
        p, w = num_after(lines, "Pages"), num_after(lines, "Words")
        if p and w:
            pages += p; words += w; counted += 1
            f["pages"] += p; f["words"] += w; f["n"] += 1
    fmts = {k: {"count": v["count"], "avgPages": round(v["pages"] / v["n"]) if v["n"] else None,
                "avgWords": round(v["words"] / v["n"]) if v["n"] else None} for k, v in by_fmt.items()}
    # totals are extrapolated from items that publish page/word counts, then rounded down to a safe round figure
    scale = total / counted if counted else 0
    return {"products": total, "measured": counted, "pagesTotal": int(pages * scale), "wordsTotal": int(words * scale), "formats": fmts}


def samples():
    manifest = [r for r in json.loads((OUT / "manifest.json").read_text("utf-8")) if r.get("status") == "ok"]
    pdir = SITE / "public" / "samples" / "pages"
    cdir = SITE / "public" / "samples" / "covers"
    for d in (pdir, cdir):
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)

    pages_out = []
    for fmt in FORMATS:
        for r in sorted((x for x in manifest if x["format"] == fmt and x["file"].endswith(".pdf")), key=lambda x: x["slug"]):
            doc = pymupdf.open(OUT / "pdfs" / r["file"])
            if len(doc) < 8:
                continue
            files = []
            # skip front matter (cover, footer page, contents); sample from inside the body
            for k, idx in enumerate((max(5, len(doc) // 5), len(doc) // 2)):
                name = f"{fmt.lower().replace(' ', '-')}-{k}.jpg"
                doc[idx].get_pixmap(dpi=85).save(pdir / name, jpg_quality=82)
                files.append(f"/samples/pages/{name}")
            pages_out.append({"format": fmt, "title": r["title"], "totalPages": len(doc) - 2, "files": files})
            break

    seen, covers = set(), []
    for r in sorted(manifest, key=lambda x: x["slug"]):
        if r["category"] in seen or len(covers) >= 12:
            continue
        seen.add(r["category"])
        shutil.copy(OUT / "thumbnails" / r["thumb"], cdir / r["thumb"])
        covers.append({"title": r["title"], "src": f"/samples/covers/{r['thumb']}"})
    return pages_out, covers


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    s = stats()
    p, c = samples()
    (SITE / "lib" / "site-assets.json").write_text(json.dumps({"stats": s, "samples": p, "covers": c}, indent=1), encoding="utf-8")
    print(f"products {s['products']}, pages ~{s['pagesTotal']:,}, words ~{s['wordsTotal']:,}")
    print("formats:", {k: (v['count'], v['avgPages']) for k, v in s['formats'].items()})
    print(f"sample page sets: {len(p)} ({[x['format'] for x in p]}), covers: {len(c)}")
