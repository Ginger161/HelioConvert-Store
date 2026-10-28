"""Phase 2: rebrand each product in raw_assets/ into processed_assets/.

usage: python -I scripts/rebrand.py [--limit N] [--ids id1,id2] [--force]

For every raw_assets/<id>/ (meta.json + product zip):
  * picks the main PDF, swaps page 1 for a HelioConvert cover, stamps a page-2 footer, rewrites metadata
  * writes processed_assets/pdfs/<slug>.pdf (or .zip when the product ships extra PDFs) and thumbnails/<slug>.jpg
  * appends a record to processed_assets/manifest.json (consumed by sync_to_db.py)
Zip members are read into memory, never extracted, so archive paths cannot escape the project.
"""
import argparse
import io
import json
import re
import sys
import zipfile
from pathlib import Path

import pymupdf as fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I drops the script dir from sys.path; covers.py lives beside us
ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / "raw_assets", ROOT / "processed_assets"
BRAND, AUTHOR = "HelioConvert", "Ginger-Eke Chienyegom"
TAGLINE = "We track leads, not just layouts"
BG, JADE, GOLD, WHITE, MUTED = (10, 10, 10), (47, 133, 102), (226, 168, 52), (240, 240, 240), (150, 150, 150)
W, H = 1200, 1600
FONTS = Path("C:/Windows/Fonts")
EXTRA_RE = re.compile(r"how to use|read ?me|instructions", re.I)


def font(name, size):
    for f in (name, "arialbd.ttf"):
        try:
            return ImageFont.truetype(str(FONTS / f), size)
        except OSError:
            continue
    return ImageFont.load_default()


def emblem():
    """Crop the sun emblem out of the full logo (top ~60%)."""
    im = Image.open(ROOT / "brand" / "logo.png").convert("RGBA")
    return im.crop((380, 290, 1100, 1010))


def avatar(size):
    """Circular headshot cropped around the face (profile.jpg is a full-body shot on a yellow backdrop)."""
    im = Image.open(ROOT / "brand" / "profile.jpg").convert("RGB").crop((185, 140, 705, 660)).resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


BIO = ("Ginger-Eke Chienyegom is a B2B digital systems architect, software developer and the founder of HelioConvert, "
       "based in Abuja, Nigeria. Ginger-Eke builds lead-generation infrastructure, AI automations and software "
       "integrations that help businesses grow predictably.")


def make_about_page(w, h):
    """Back-of-book 'About the Author' page, rendered as an image sized to the book's page."""
    s = w / 600  # layout is designed at 600pt wide
    im = Image.new("RGB", (int(w * 2), int(h * 2)), BG)
    d = ImageDraw.Draw(im)
    k = 2 * s
    d.text((50 * k, 60 * k), "> [SYS] ABOUT THE AUTHOR", font=font("consola.ttf", int(13 * k)), fill=JADE)
    av = avatar(int(150 * k))
    im.paste(av, (int(50 * k), int(100 * k)), av)
    d.text((225 * k, 130 * k), AUTHOR, font=font("segoeuib.ttf", int(26 * k)), fill=WHITE)
    d.text((225 * k, 170 * k), f"Founder, {BRAND}", font=font("segoeui.ttf", int(15 * k)), fill=GOLD)
    d.text((225 * k, 198 * k), "Abuja, Nigeria", font=font("segoeui.ttf", int(13 * k)), fill=MUTED)
    bf = font("segoeui.ttf", int(15 * k))
    y = 290 * k
    for ln in wrap(d, BIO, bf, 500 * k):
        d.text((50 * k, y), ln, font=bf, fill=WHITE)
        y += 24 * k
    d.line([50 * k, y + 20 * k, 140 * k, y + 20 * k], fill=GOLD, width=int(3 * k))
    d.text((50 * k, y + 40 * k), "helioconvrt.com", font=font("consola.ttf", int(15 * k)), fill=JADE)
    d.text((50 * k, h * 2 - 70 * k), TAGLINE, font=font("segoeui.ttf", int(13 * k)), fill=MUTED)
    return im


def wrap(draw, text, fnt, width):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    return lines + [cur] if cur else lines


from covers import make_cover  # noqa: E402  (format-native, category-coloured cover art; also used by build_bundles.py)
from descriptions import buyer_description, lead_from_tagline  # noqa: E402  (buyer-facing copy; the source text is written for course resellers)
from covers import clean_title as clean_title_text  # noqa: E402


TAGLINE_RE = re.compile(r"(designed|to help|to guide|help) (to help )?(your )?customers|^(notion template|ebook|guide|checklist|workbook|listicle|prompt pack|toolstack|mini-?course)\b.* to (help|guide|define|track|manage)", re.I)
FORMAT_SUFFIX_RE = re.compile(r"\s+-\s+(Ebook|Book|Guide|Checklist|Workbook|Listicle|Mini-?Course|Prompts?|Prompt Pack|Toolstack)$", re.I)


def title_from_crumbs(crumbs):
    """Fallback when the zip has no top folder. The last crumb is sometimes the marketing tagline; the real title is the one before it."""
    last = crumbs[-1] if crumbs else ""
    if len(crumbs) > 1 and (len(last) > 70 or TAGLINE_RE.search(last)):
        last = crumbs[-2]
    return FORMAT_SUFFIX_RE.sub("", last).strip()


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:70]


def clean_description(meta):
    """Pull tagline + overview paragraph from the product page text; reseller wording -> reader wording."""
    lines = [l for l in meta.get("description", "").split("\n") if l.strip()]
    crumbs = set(meta.get("crumbs", []))
    body = [l for l in lines if l not in crumbs]
    paras = [l for l in body if len(l) > 60 and not l.startswith("Offer your customers")]
    text = "\n\n".join(paras[:2])
    text = re.sub(r"\b[Yy]our customers\b", lambda m: "you" if m.group()[0] == "y" else "You", text)
    return text.strip()


def pdf_has_foreign_brand(data):
    try:
        with fitz.open(stream=data, filetype="pdf") as d:
            return any(re.search(r"entrepedia", p.get_text(), re.I) for p in d)
    except Exception:
        return False


def brand_pdf(data, title, kind, category):
    doc = fitz.open(stream=data, filetype="pdf")
    cover = make_cover(title, kind, category)
    buf = io.BytesIO()
    cover.save(buf, "JPEG", quality=88)  # grain makes PNG covers multi-MB; JPEG keeps each PDF small
    r = doc[0].rect
    doc.new_page(0, width=r.width, height=r.height)  # becomes the new page 1
    doc[0].insert_image(doc[0].rect, stream=buf.getvalue())
    doc.delete_page(1)  # original cover
    if len(doc) > 1:
        p = doc[1]
        p.insert_text((p.rect.width / 2 - 95, p.rect.height - 28), f"Published and Distributed by {BRAND}",
                      fontsize=8, fontname="helv", color=(0.45, 0.45, 0.45))
    about = io.BytesIO()
    make_about_page(r.width, r.height).save(about, "PNG")
    doc.new_page(-1, width=r.width, height=r.height)  # appended last page
    doc[-1].insert_image(doc[-1].rect, stream=about.getvalue())
    doc.set_metadata({"title": title, "author": AUTHOR, "creator": BRAND, "producer": BRAND,
                      "subject": f"{category} - {kind}".strip(" -"), "keywords": "", "creationDate": "", "modDate": ""})
    doc.set_xml_metadata("")
    out = doc.tobytes(garbage=3, deflate=True)
    doc.close()
    return out, cover


def zname(info):
    """Zip names without the UTF-8 flag are decoded as cp437 by zipfile; recover the real UTF-8 name."""
    if info.flag_bits & 0x800:
        return info.filename
    try:
        return info.filename.encode("cp437").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return info.filename


def link_instructions(link):
    """Where to find the 'make your own copy' action, by platform. Notion is all we sell today; others fall back to generic wording."""
    host = re.sub(r"^https?://([^/]+).*", r"\1", link).lower()
    if "notion" in host:
        return ["Click \"Open your template\" above (or paste the link into your browser).",
                "Sign in to Notion. A free account is enough.",
                "Look for Duplicate at the top right of the page, or in the (...) menu, to copy the template into your own workspace.",
                "Rename it and edit anything you like. Your copy is yours."]
    return ["Click \"Open your template\" above (or paste the link into your browser).",
            "Sign in to the app it opens in if asked.",
            "Choose the option to copy or duplicate it into your own account.",
            "Rename it and edit anything you like. Your copy is yours."]


def make_link_pdf(title, kind, category, link, lead):
    """Link products (Notion templates) have no file to rebrand, so the buyer's download is a branded PDF that holds their link."""
    cover = make_cover(title, kind, category)
    w, h = 595, 842
    doc = fitz.open()
    buf = io.BytesIO()
    cover.save(buf, "JPEG", quality=88)
    p1 = doc.new_page(width=w, height=h)
    p1.insert_image(p1.rect, stream=buf.getvalue())

    p = doc.new_page(width=w, height=h)
    p.draw_rect(p.rect, color=None, fill=(0.04, 0.04, 0.04))
    jade, gold, white, muted = (0.18, 0.52, 0.40), (0.89, 0.66, 0.20), (0.94, 0.94, 0.94), (0.62, 0.62, 0.62)
    p.insert_text((50, 70), "> [SYS] YOUR TEMPLATE", fontsize=11, fontname="cour", color=jade)
    def fit_text(rect, text, fontname, size, floor, color, align=0):
        # PyMuPDF draws nothing at all when text overflows its box, so shrink until it fits
        while size >= floor:
            if p.insert_textbox(rect, text, fontsize=size, fontname=fontname, color=color, align=align) >= 0:
                return
            size -= 1
        p.insert_textbox(rect, text[: int(rect.width * rect.height / (floor * floor * 0.6))], fontsize=floor, fontname=fontname, color=color, align=align)

    fit_text(fitz.Rect(50, 92, w - 50, 190), title, "hebo", 28, 16, white)
    fit_text(fitz.Rect(50, 196, w - 50, 284), lead, "helv", 12.5, 9, muted)
    btn = fitz.Rect(50, 296, 330, 346)
    p.draw_rect(btn, color=None, fill=gold, radius=0.25)
    p.insert_textbox(fitz.Rect(50, 309, 330, 346), "Open your template", fontsize=16, fontname="hebo", color=(0.04, 0.04, 0.04), align=1)
    p.insert_link({"kind": fitz.LINK_URI, "from": btn, "uri": link})
    urect = fitz.Rect(50, 354, w - 50, 378)
    p.insert_textbox(urect, link, fontsize=8, fontname="cour", color=jade)
    p.insert_link({"kind": fitz.LINK_URI, "from": urect, "uri": link})
    p.insert_text((50, 420), "How to use it", fontsize=15, fontname="hebo", color=gold)
    y = 446
    for i, step in enumerate(link_instructions(link), 1):
        p.insert_text((50, y + 12), str(i), fontsize=13, fontname="hebo", color=gold)
        p.insert_textbox(fitz.Rect(78, y, w - 50, y + 52), step, fontsize=12, fontname="helv", color=white)
        y += 56
    p.insert_textbox(fitz.Rect(50, y + 14, w - 50, y + 70), "Keep this PDF safe: it is where your template link lives, so you can open it again any time.", fontsize=10.5, fontname="heit", color=muted)
    p.insert_text((w / 2 - 95, h - 28), f"Published and Distributed by {BRAND}", fontsize=8, fontname="helv", color=(0.45, 0.45, 0.45))

    about = io.BytesIO()
    make_about_page(w, h).convert("RGB").save(about, "JPEG", quality=88)
    pa = doc.new_page(width=w, height=h)
    pa.insert_image(pa.rect, stream=about.getvalue())
    doc.set_metadata({"title": title, "author": AUTHOR, "creator": BRAND, "producer": BRAND, "subject": f"{category} - {kind}".strip(" -"), "keywords": "", "creationDate": "", "modDate": ""})
    out = doc.tobytes(garbage=3, deflate=True)
    doc.close()
    return out, cover


def process_link(rec_dir, meta, crumbs, category, kind):
    title = clean_title_text(meta.get("h1") or title_from_crumbs(crumbs) or rec_dir.name)
    slug = f"{slugify(title)}-{meta['id'][:4]}"
    tag = next((l for l in meta.get("description", "").split("\n") if re.match(r"^notion\s+template\b", l.strip(), re.I)), "")
    lead = lead_from_tagline(tag, kind) if tag else None
    lead = lead or f"A ready-made {kind.lower()} for {category.lower()}, built to be copied into your own workspace and used straight away."
    pdf, cover = make_link_pdf(title, kind, category, meta["link"], lead)
    (OUT / "pdfs").mkdir(parents=True, exist_ok=True)
    (OUT / "thumbnails").mkdir(parents=True, exist_ok=True)
    (OUT / "pdfs" / f"{slug}.pdf").write_bytes(pdf)
    cover.resize((480, 640)).save(OUT / "thumbnails" / f"{slug}.jpg", quality=85)
    return {"id": meta["id"], "title": title, "slug": slug, "description": buyer_description(meta, title, kind, category, pdf), "category": category,
            "subcategory": crumbs[1] if len(crumbs) > 1 else None, "format": kind, "file": f"{slug}.pdf", "thumb": f"{slug}.jpg",
            "status": "ok", "warnings": [], "delivery": "link"}


def process(rec_dir, force):
    meta = json.loads((rec_dir / "meta.json").read_text(encoding="utf-8"))
    crumbs = meta.get("crumbs") or []
    category = crumbs[0] if crumbs else "General"
    kind = meta.get("contains") or ""
    if meta.get("link") and "file" not in meta:  # Notion templates etc.: the "download" is a link, delivered inside a branded PDF
        return process_link(rec_dir, meta, crumbs, category, kind)
    if "file" not in meta:  # download deliberately skipped (audio)
        return {"id": meta["id"], "title": crumbs[-1] if crumbs else rec_dir.name, "status": "no_pdf", "format": kind}
    zpath = rec_dir / meta["file"]
    with zipfile.ZipFile(zpath) as z:
        # Breadcrumb depth varies (last entry can be the tagline), so the title comes from the zip's top folder: "<Title> - <Format>"
        top = next((zname(i).split("/")[0] for i in z.infolist() if not i.filename.startswith("__MACOSX") and "/" in i.filename), "")
        head, _, tail = top.rpartition(" - ")
        title = (head if head and len(tail) <= 20 else top) or title_from_crumbs(crumbs) or rec_dir.name
        slug = f"{slugify(title)}-{meta['id'][:4]}"
        pdfs = [i for i in z.infolist() if i.filename.lower().endswith(".pdf") and not i.filename.startswith("__MACOSX")
                and not Path(i.filename).name.startswith("._")]
        main = [i for i in pdfs if not EXTRA_RE.search(Path(i.filename).name)] or pdfs
        if not main:
            return {"id": meta["id"], "title": title, "status": "no_pdf", "format": kind}
        main_info = max(main, key=lambda i: i.file_size)
        extras = [i for i in pdfs if i is not main_info]
        warnings = []
        main_bytes, cover = brand_pdf(z.read(main_info), title, kind, category)
        if pdf_has_foreign_brand(main_bytes):
            warnings.append("original branding text remains in body")
        (OUT / "pdfs").mkdir(parents=True, exist_ok=True)
        (OUT / "thumbnails").mkdir(parents=True, exist_ok=True)
        if extras:
            fname = f"{slug}.zip"
            with zipfile.ZipFile(OUT / "pdfs" / fname, "w", zipfile.ZIP_DEFLATED) as zo:
                zo.writestr(f"{title}.pdf", main_bytes)
                for e in extras:
                    zo.writestr(Path(zname(e)).name, z.read(e))  # companion guides, untouched
        else:
            fname = f"{slug}.pdf"
            (OUT / "pdfs" / fname).write_bytes(main_bytes)
    cover.resize((480, 640)).save(OUT / "thumbnails" / f"{slug}.jpg", quality=85)
    return {"id": meta["id"], "title": title, "slug": slug, "description": buyer_description(meta, title, kind, category, main_bytes), "category": category,
            "subcategory": crumbs[1] if len(crumbs) > 1 else None, "format": kind, "file": fname,
            "thumb": f"{slug}.jpg", "status": "ok", "warnings": warnings}


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # titles contain non-cp1252 characters
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--ids", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--shard", default="", help="K/N: process only products whose id hashes to K of N (run N processes in parallel)")
    ap.add_argument("--merge", action="store_true", help="combine manifest.shard*.json into manifest.json and exit")
    a = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    if a.merge:
        merged = {}
        for f in sorted(OUT.glob("manifest.shard*.json")):
            merged.update({r["id"]: r for r in json.loads(f.read_text("utf-8"))})
        (OUT / "manifest.json").write_text(json.dumps(list(merged.values()), indent=1), encoding="utf-8")
        return print(f"merged {len(merged)} records")
    shard_k, shard_n = (int(x) for x in a.shard.split("/")) if a.shard else (0, 1)
    mpath = OUT / (f"manifest.shard{shard_k}.json" if a.shard else "manifest.json")
    manifest = {r["id"]: r for r in json.loads(mpath.read_text("utf-8"))} if mpath.exists() else {}
    dirs = sorted(d for d in RAW.iterdir() if (d / "meta.json").exists() and int(d.name.replace("-", ""), 16) % shard_n == shard_k)
    if a.ids:
        want = set(a.ids.split(","))
        dirs = [d for d in dirs if d.name[:8] in want or d.name in want]
    if a.limit:
        dirs = dirs[: a.limit]
    for i, d in enumerate(dirs, 1):
        if d.name in manifest and manifest[d.name].get("status") in ("ok", "no_pdf") and not a.force:
            continue
        try:
            rec = process(d, a.force)
        except Exception as e:  # keep the batch going; failures are listed in the manifest
            rec = {"id": d.name, "status": "error", "error": str(e)[:200]}
        manifest[d.name] = rec
        print(f"[{i}/{len(dirs)}] {d.name[:8]} {rec['status']} {rec.get('title', '')[:50]} {rec.get('warnings') or ''}")
        mpath.write_text(json.dumps(list(manifest.values()), indent=1), encoding="utf-8")


if __name__ == "__main__":
    sys.exit(main())
