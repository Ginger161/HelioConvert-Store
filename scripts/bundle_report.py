"""Which bundles are complete, and why any are not.

usage: python -I scripts/bundle_report.py
For every bundle on Entrepedia (bundles.json) compare its products with what is live in the store:
  live        - rebranded and uploaded
  audio       - audio episodes, left out on purpose for now
  no_pdf      - the product ships in a format we cannot turn into a PDF (e.g. a Word .docx workbook)
  missing     - should be live but is not (a real gap)
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT, RAW = ROOT / "processed_assets", ROOT / "raw_assets"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

bundles = json.loads((ROOT / "bundles.json").read_text("utf-8"))
manifest = {r["id"]: r for r in json.loads((OUT / "manifest.json").read_text("utf-8"))}


def reason(item):
    rec = manifest.get(item["id"])
    if rec and rec.get("status") == "ok":
        return "live"
    meta_f = RAW / item["id"] / "meta.json"
    meta = json.loads(meta_f.read_text("utf-8")) if meta_f.exists() else {}
    if meta.get("skipped") == "audio" or (rec or {}).get("format") == "Audio" or item.get("format") == "Audio":
        return "audio"
    if rec and rec.get("status") == "no_pdf":
        return "no_pdf"
    return "missing"


tally, complete, incomplete = Counter(), 0, []
for b in bundles:
    why = Counter(reason(i) for i in b["items"])
    tally.update(why)
    gaps = {k: v for k, v in why.items() if k in ("no_pdf", "missing")}
    if gaps:
        incomplete.append((b["title"], dict(why), len(b["items"])))
    else:
        complete += 1

total = sum(tally.values())
print(f"bundles on Entrepedia: {len(bundles)} | complete apart from audio: {complete} | with a real gap: {len(incomplete)}")
print(f"items across all bundles: {total} -> " + ", ".join(f"{k} {v}" for k, v in tally.most_common()))
for title, why, n in incomplete[:25]:
    print(f"   {title[:48]:48} {n} items: {why}")
