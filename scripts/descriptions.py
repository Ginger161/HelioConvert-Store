"""Buyer-facing product descriptions.

The source copy (Entrepedia) is written for people who RESELL courses ("help your customers...", "upsell your offering").
Our shoppers are the learners, so each description is rebuilt from three honest parts:
  1. a lead sentence, converted from the tagline into buyer voice (or a plain fallback if it can't be converted safely),
  2. a format sentence with the real page count,
  3. "Inside:" - the PDF's own table of contents, when it has a usable one.
The second paragraph of the source copy is dropped on purpose: it is the part that speaks to resellers.
"""
import io
import json
import re
import zipfile
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / "raw_assets", ROOT / "processed_assets"

FMT = r"(?:e-?book|guide|checklist|listicle|email course|mini-?course|prompt pack|prompts?|toolstack|workbook|template|playbook|cheat ?sheet|swipe file|podcast episode|worksheet|planner)"
AUDIENCE = r"(?:customers?|clients?|audience|users?|students?|subscribers?|readers?|members?|followers?)"
VERBS = {"help": "Helps you", "guide": "Guides you", "teach": "Teaches you", "show": "Shows you", "give": "Gives you", "walk": "Walks you",
         "equip": "Equips you", "support": "Supports you", "enable": "Enables you", "empower": "Empowers you", "assist": "Helps you"}
KIND_PHRASE = {"Book": "book", "Guide": "guide", "Mini-Course": "email mini-course", "Checklist": "checklist", "Listicle": "list",
               "Prompt Pack": "prompt pack", "Toolstack": "toolstack", "Workbook": "workbook"}

# phrases that only make sense when talking to someone who sells the product
RESELLER = re.compile(r"upsell|your offering|resell|position (yourself|you)|establish(ing)? (your )?(expertise|authority)|done-for-you|white.?label|brand (it|them) as", re.I)


def _you(text):
    """'their/them/they' referred to the seller's customers; in buyer voice they become 'your/you'."""
    text = re.sub(r"\bthemselves\b", "yourself", text, flags=re.I)
    text = re.sub(r"\btheir\b", "your", text, flags=re.I)
    text = re.sub(r"\bthem\b", "you", text, flags=re.I)
    text = re.sub(r"\bthey're\b", "you're", text, flags=re.I)
    text = re.sub(r"\bthey\b", "you", text, flags=re.I)
    return text


def lead_from_tagline(tagline, fmt):
    t = tagline.strip()
    m = re.match(rf"^{FMT}\s+(?:designed\s+)?to\s+({'|'.join(VERBS)})\s+(?:your\s+)?{AUDIENCE}\s+(.*)$", t, re.I)
    if m:
        rest = m.group(2)
        rest = re.sub(r",?\s*(?:empowering|enabling|helping|allowing|so)\s+them\s+(?:to\s+)?", ", so you can ", rest, flags=re.I)
        lead = f"{VERBS[m.group(1).lower()]} {_you(rest)}"
    else:
        # seller-addressed variant: "...to help you provide expert guidance on X while upselling your offering"
        m2 = re.match(rf"^{FMT}\s+(?:designed\s+)?to\s+help\s+you\s+provide\s+(?:expert\s+)?guidance\s+(?:on|about|for|in)\s+(.*)$", t, re.I)
        if not m2:
            return None
        # cut only the seller clause ("... while upselling your offering"), never a real goal like "and build credibility"
        topic = re.split(r"[,\s]+(?:while|and)\s+(?:upsell|(?:offering|promoting|establishing|positioning)\s+(?:your|you))", m2.group(1), flags=re.I)[0].strip(" ,.")
        lead = f"A practical {KIND_PHRASE.get(fmt, 'resource')} on {topic}"
    lead = re.sub(r"\s+", " ", lead).replace(" ,", ",").strip()
    if not lead.endswith((".", "!", "?")):
        lead += "."
    return None if RESELLER.search(lead) or len(lead) < 25 else lead


def format_sentence(fmt, pages):
    n = f"{pages}-page " if pages else ""
    return {
        "Book": f"A {n}book. Read it cover to cover, or jump straight to the chapter you need.",
        "Guide": f"A {n}step-by-step guide. Follow it at your own pace and put each step to work as you go.",
        "Checklist": f"A {n}checklist. Work through it and tick items off as you go.",
        "Listicle": f"A {n}list that is quick to read and easy to act on.",
        "Mini-Course": "A day-by-day email mini-course, written as short lessons you can follow one at a time.",
        "Prompt Pack": f"A {n}pack of ready-to-use AI prompts. Copy them, adapt them to your own work, and save hours.",
        "Toolstack": f"A {n}toolstack: the tools to use for this job and how to put them to work.",
    }.get(fmt, f"A {n}resource you can start using today.")


BORING = re.compile(r"^(table of contents|contents|disclaimer|introduction|conclusion|about( the author| us)?|cover|copyright|acknowledg\w*|bonus|resources?|references?|index|notes?|thank you|final thoughts?|next steps|summary|welcome|how to use.*|legal.*|email n\.?\s*\d+|day \d+|lesson \d+|categories)$", re.I)


TAIL_WORDS = {"a", "an", "the", "of", "in", "on", "for", "to", "and", "or", "with", "at", "by", "your", "you", "from", "into", "is", "that"}
ACRONYMS = {"seo": "SEO", "ai": "AI", "crm": "CRM", "roi": "ROI", "kpi": "KPI", "kpis": "KPIs", "ugc": "UGC", "b2b": "B2B", "b2c": "B2C", "saas": "SaaS",
            "ppc": "PPC", "cta": "CTA", "faq": "FAQ", "sop": "SOP", "sops": "SOPs", "api": "API", "ceo": "CEO", "cfo": "CFO", "hr": "HR", "aeo": "AEO",
            "gdpr": "GDPR", "mvp": "MVP", "ux": "UX", "ui": "UI", "sms": "SMS", "pr": "PR", "qa": "QA", "usa": "USA", "uk": "UK", "vat": "VAT", "ip": "IP",
            "tiktok": "TikTok", "linkedin": "LinkedIn", "youtube": "YouTube", "chatgpt": "ChatGPT", "openai": "OpenAI", "facebook": "Facebook", "wordpress": "WordPress"}
SMALL = {"a", "an", "the", "of", "in", "on", "for", "to", "and", "or", "with", "at", "by", "vs", "from", "into"}


def _smart_title(text):
    words = text.lower().split()
    return " ".join(ACRONYMS.get(w.strip(".,:;!?()"), w if (i and w in SMALL) else w.capitalize()) if w.strip(".,:;!?()") in ACRONYMS else (w if (i and w in SMALL) else w.capitalize()) for i, w in enumerate(words))


def toc_bullets(pdf_bytes, title):
    try:
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as d:
            raw = [re.sub(r"\s+", " ", x[1]).strip() for x in d.get_toc() if x[0] == 1]
    except Exception:
        return []
    # a long heading is often bookmarked as two entries ("Mindful Focus in" + "a Distracted World"): join them back up
    entries, i = [], 0
    while i < len(raw):
        cur = raw[i]
        while cur and cur.split()[-1].lower().strip(".,:") in TAIL_WORDS and i + 1 < len(raw):
            i += 1
            cur = f"{cur} {raw[i]}".strip()
        entries.append(cur)
        i += 1
    out, seen = [], set()
    for e in entries:
        e = e.strip(" .:-–—")
        if not (4 <= len(e) <= 80) or BORING.match(e) or e.lower() == title.lower() or re.fullmatch(r"[\W\d_]+", e) or e.lower() in seen:
            continue
        if e[0].islower() or e.split()[-1].lower() in TAIL_WORDS:  # still a fragment after joining
            continue
        seen.add(e.lower())
        out.append(_smart_title(e) if e.isupper() else e)
    return out[:8] if len(out) >= 3 else []


def _num_after(lines, label):
    if label in lines:
        i = lines.index(label)
        if i + 1 < len(lines) and re.fullmatch(r"[\d,]+", lines[i + 1]):
            return int(lines[i + 1].replace(",", ""))
    return None


def _tagline(meta):
    for line in (l.strip() for l in meta.get("description", "").split("\n")):
        if re.match(rf"^{FMT}\b", line, re.I) and re.search(rf"\b(your\s+)?{AUDIENCE}\b|\byou\b", line, re.I) and len(line) > 40:
            return line
    return None


def buyer_description(meta, title, fmt, category, pdf_bytes):
    lines = [l.strip() for l in meta.get("description", "").split("\n")]
    pages = _num_after(lines, "Pages")
    tag = _tagline(meta)
    lead = lead_from_tagline(tag, fmt) if tag else None
    if not lead:
        lead = f"A practical {KIND_PHRASE.get(fmt, 'resource')} in {category or 'business and growth'}, written to be put to use straight away."
    parts = [lead, format_sentence(fmt, pages)]
    bullets = toc_bullets(pdf_bytes, title) if pdf_bytes else []
    if bullets:
        parts.append("Inside:\n" + "\n".join(f"• {b}" for b in bullets))
    return "\n\n".join(parts)


def main_pdf_bytes(record):
    f = OUT / "pdfs" / record["file"]
    if not f.exists():
        return None
    if f.suffix == ".pdf":
        return f.read_bytes()
    with zipfile.ZipFile(f) as z:  # products with companion files ship as a zip; the branded main PDF is named after the title
        names = [i.filename for i in z.infolist() if i.filename.lower().endswith(".pdf")]
        main = next((n for n in names if n == f"{record['title']}.pdf"), None) or (names[0] if names else None)
        return z.read(main) if main else None


def describe_record(record):
    meta = json.loads((RAW / record["id"] / "meta.json").read_text(encoding="utf-8"))
    return buyer_description(meta, record["title"], record.get("format") or "", record.get("category") or "", main_pdf_bytes(record))
