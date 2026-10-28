"""Format-native, category-coloured cover art (1200x1600).

Each product format has its own layout so a book reads as a book, a checklist as a checklist, and so on.
Category picks the colour palette; a per-title seed picks the background pattern, so no two covers match.
"""
import hashlib
import random
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path("C:/Windows/Fonts")
W, H = 1200, 1600
BRAND, AUTHOR = "HelioConvert", "Ginger-Eke Chienyegom"
WHITE, INK, PAPER = (244, 244, 240), (22, 24, 28), (243, 238, 226)

# category -> (dark base, lighter base, accent)
PALETTES = {
    "Digital Marketing": ((42, 15, 20), (86, 24, 36), (255, 107, 87)),
    "Content Creation": ((28, 18, 51), (62, 34, 108), (183, 140, 255)),
    "Startups": ((13, 27, 51), (24, 58, 104), (90, 169, 255)),
    "Personal Growth": ((11, 42, 34), (20, 86, 66), (61, 220, 151)),
    "Personal Development": ((12, 38, 40), (22, 78, 82), (94, 224, 208)),
    "Special Topics": ((26, 29, 36), (50, 58, 74), (200, 209, 224)),
    "Automation": ((6, 35, 43), (13, 74, 92), (53, 208, 230)),
    "E-commerce": ((43, 26, 8), (96, 58, 18), (255, 179, 71)),
    "Habits": ((28, 36, 16), (60, 78, 28), (182, 227, 90)),
    "AI": ((26, 15, 51), (59, 27, 109), (232, 121, 249)),
    "Solopreneur": ((46, 20, 12), (98, 44, 26), (255, 157, 108)),
    "Cybersecurity": ((4, 20, 10), (10, 58, 28), (77, 255, 136)),
    "Energy": ((42, 32, 8), (96, 76, 16), (255, 210, 74)),
    "Sales": ((20, 23, 31), (44, 52, 71), (255, 138, 61)),
    "Creator Economy": ((46, 15, 34), (100, 34, 76), (255, 126, 182)),
    "Freelancing": ((7, 37, 42), (15, 80, 88), (94, 224, 208)),
    "Mindset": ((34, 15, 46), (72, 34, 96), (217, 166, 255)),
    "Branding": ((42, 14, 24), (90, 26, 54), (255, 196, 107)),
    "Systems and Productivity": ((16, 29, 43), (34, 64, 96), (126, 200, 255)),
    "Social Media": ((14, 26, 51), (35, 63, 122), (122, 162, 255)),
    "Wellness": ((18, 38, 31), (42, 85, 70), (155, 231, 196)),
    "Video and Podcast": ((37, 16, 29), (77, 31, 60), (255, 143, 163)),
    "Leadership": ((12, 20, 38), (27, 43, 82), (255, 207, 90)),
    "Parenting": ((44, 26, 20), (91, 51, 38), (255, 177, 153)),
    "Tech Tools": ((20, 22, 26), (42, 47, 56), (143, 184, 255)),
}
FALLBACK = ((14, 34, 28), (28, 70, 56), (226, 168, 52))


def palette(category):
    return PALETTES.get(category, FALLBACK)


def font(name, size):
    for f in (name, "segoeuib.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(str(FONTS / f), size)
        except OSError:
            continue
    return ImageFont.load_default()


def rng_for(title):
    return random.Random(int(hashlib.md5(title.encode("utf-8")).hexdigest()[:8], 16))


def emblem(size=100):
    im = Image.open(ROOT / "brand" / "logo.png").convert("RGBA").crop((380, 290, 1100, 1010))
    return im.resize((size, size), Image.LANCZOS)


def avatar(size):
    im = Image.open(ROOT / "brand" / "profile_face.jpg").convert("RGB").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask.resize((size, size), Image.LANCZOS))
    return out


def wrap(draw, text, fnt, width):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    return lines + [cur] if cur else lines


def fit(draw, text, fname, width, max_lines, start, floor=44):
    size = start
    while True:
        f = font(fname, size)
        lines = wrap(draw, text, f, width)
        if (len(lines) <= max_lines and all(draw.textlength(l, font=f) <= width for l in lines)) or size <= floor:
            return f, lines
        size -= 4


def gradient(top, bottom):
    base = Image.new("RGB", (1, H))
    for y in range(H):
        t = y / (H - 1)
        base.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize((W, H))


def pattern(accent, rnd, kind=None, alpha=55):
    kind = kind or rnd.choice(["rings", "diagonals", "dots", "waves", "grid", "blobs"])
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    a = (*accent, alpha)
    if kind == "rings":
        cx, cy, step = rnd.randint(650, 1250), rnd.randint(-100, 500), rnd.choice([56, 78, 104])
        for r in range(step, 1900, step):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=a, width=3)
    elif kind == "diagonals":
        step, wd = rnd.choice([44, 66, 96]), rnd.choice([2, 4, 6])
        for x in range(-H, W, step):
            d.line([x, 0, x + H * 0.7, H], fill=a, width=wd)
    elif kind == "dots":
        step = 38
        for y in range(0, H, step):
            for x in range(0, W, step):
                r = max(0.0, 15 * (1 - (x / W) * 0.55 - (y / H) * 0.65) + 3)
                d.ellipse([x - r, y - r, x + r, y + r], fill=a)
    elif kind == "waves":
        import math
        amp, freq, ph = rnd.randint(40, 110), rnd.uniform(0.004, 0.009), rnd.uniform(0, 6)
        for k in range(22):
            y0 = k * 70 - 80
            d.line([(x, y0 + amp * math.sin(x * freq + ph + k * 0.35)) for x in range(0, W + 20, 20)], fill=a, width=3)
    elif kind == "grid":
        hy = rnd.randint(500, 800)
        for i in range(-14, 30):
            d.line([(W / 2 + (i - 8) * 30, hy), (W / 2 + (i - 8) * 190, H)], fill=a, width=2)
        for k in range(1, 16):
            y = hy + (k ** 1.9) * 3.4
            if y < H:
                d.line([0, y, W, y], fill=a, width=2)
    else:  # blobs: soft glows
        for _ in range(4):
            cx, cy, r = rnd.randint(0, W), rnd.randint(0, int(H * 0.7)), rnd.randint(220, 460)
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*accent, 70))
        ov = ov.filter(ImageFilter.GaussianBlur(110))
    return ov


def noise(im, strength=10, seed=1):
    """Fine grain so flat colour doesn't look digital."""
    r = random.Random(seed)
    grain = Image.effect_noise((W // 2, H // 2), 40).resize((W, H)).convert("RGB")
    return Image.blend(im, grain, strength / 255)


def footer(im, color=WHITE, muted=(150, 150, 150), y=H - 190, x=90):
    d = ImageDraw.Draw(im)
    em = emblem(92)
    im.paste(em, (x, y), em)
    d.text((x + 112, y + 2), BRAND, font=font("segoeuib.ttf", 42), fill=color)
    av = avatar(60)
    im.paste(av, (x + 112, y + 58), av)
    d.text((x + 184, y + 68), AUTHOR, font=font("segoeui.ttf", 26), fill=muted)


def label(d, text, x, y, accent, size=30):
    d.text((x, y), text, font=font("consolab.ttf", size), fill=accent)


def lead_number(title):
    m = re.match(r"\s*(\d{1,3})\b", title)
    return m.group(1) if m else None


# ------------------------------------------------------------------ templates
def book(title, cat, base, light, accent, rnd):
    im = gradient(base, light).convert("RGBA")
    im = Image.alpha_composite(im, pattern(accent, rnd, alpha=48)).convert("RGB")
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 78, H], fill=tuple(int(c * 0.55) for c in base))            # spine
    d.rectangle([78, 0, 84, H], fill=accent)
    label(d, f"BOOK  /  {cat.upper()}", 150, 120, accent)
    f, lines = fit(d, title, "georgiab.ttf", W - 300, 7, 118)
    y = 250
    for ln in lines:
        d.text((150, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.16)
    d.rectangle([150, y + 26, 420, y + 34], fill=accent)
    em = emblem(560)  # large faded emblem fills the lower half like a printed crest
    em.putalpha(em.split()[3].point(lambda v: int(v * 0.28)))
    im.paste(em, (W - 600, H - 900), em)
    footer(im, x=150)
    return im


def guide(title, cat, base, light, accent, rnd):
    im = Image.new("RGB", (W, H), base)
    art = gradient(light, base).convert("RGBA")
    art = Image.alpha_composite(art, pattern(accent, rnd, alpha=90)).convert("RGB")
    im.paste(art.crop((0, 0, W, 800)), (0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 800, W, H], fill=base)
    d.rectangle([0, 800, W, 812], fill=accent)
    d.rounded_rectangle([90, 90, 360, 150], 30, fill=accent)
    d.text((124, 98), "GUIDE", font=font("bahnschrift.ttf", 40), fill=INK)
    d.text((90, 168), cat.upper(), font=font("consola.ttf", 28), fill=WHITE)
    f, lines = fit(d, title, "bahnschrift.ttf", W - 180, 5, 104)
    y = 870
    for ln in lines:
        d.text((90, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.12)
    d.text((90, y + 24), "STEP-BY-STEP", font=font("consolab.ttf", 30), fill=accent)
    for i in range(3):  # three numbered steps hint at the guide's structure
        cx = 110 + i * 130
        d.ellipse([cx, y + 90, cx + 90, y + 180], outline=accent, width=5)
        d.text((cx + 45, y + 135), str(i + 1), font=font("bahnschrift.ttf", 48), fill=accent, anchor="mm")
        if i < 2:
            d.line([cx + 96, y + 135, cx + 124, y + 135], fill=accent, width=4)
    footer(im, x=90, y=H - 170)
    return im


def checklist(title, cat, base, light, accent, rnd):
    im = gradient(base, light)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([120, 120, W - 120, H - 80], 28, fill=PAPER)                # sheet
    d.rounded_rectangle([W // 2 - 150, 70, W // 2 + 150, 190], 26, fill=(70, 74, 82))  # clip
    d.rounded_rectangle([W // 2 - 110, 100, W // 2 + 110, 150], 18, fill=(30, 32, 36))
    label(d, "CHECKLIST", 190, 250, tuple(int(c * 0.7) for c in accent), 30)
    f, lines = fit(d, title, "segoeuib.ttf", W - 440, 4, 84)
    y = 310
    for ln in lines:
        d.text((190, y), ln, font=f, fill=INK)
        y += int(f.size * 1.14)
    d.rectangle([190, y + 14, 420, y + 20], fill=accent)
    y += 80
    for i in range(7):
        d.rounded_rectangle([190, y, 242, y + 52], 10, outline=INK, width=5)
        if rnd.random() < 0.6 or i < 2:
            d.line([(202, y + 28), (214, y + 40), (236, y + 10)], fill=tuple(int(c * 0.8) for c in accent), width=9)
        d.rounded_rectangle([274, y + 14, 274 + rnd.randint(380, 700), y + 36], 11, fill=(196, 190, 176))
        y += 96
        if y > H - 330:
            break
    d.text((190, H - 220), BRAND, font=font("segoeuib.ttf", 38), fill=INK)
    av = avatar(50)
    im.paste(av, (190, H - 164), av)
    d.text((252, H - 158), AUTHOR, font=font("segoeui.ttf", 24), fill=(90, 90, 90))
    em = emblem(84)
    im.paste(em, (W - 120 - 84 - 50, H - 220), em)
    return im


def minicourse(title, cat, base, light, accent, rnd):
    im = gradient(base, light).convert("RGBA")
    im = Image.alpha_composite(im, pattern(accent, rnd, "blobs", 60)).convert("RGB")
    d = ImageDraw.Draw(im)
    label(d, "E-MAIL MINI-COURSE", 110, 110, accent)
    d.rounded_rectangle([110, 190, W - 110, 900], 30, fill=(246, 246, 243))        # mail window
    d.rounded_rectangle([110, 190, W - 110, 270], 30, fill=(226, 226, 222))
    d.rectangle([110, 240, W - 110, 270], fill=(226, 226, 222))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([146 + i * 44, 218, 170 + i * 44, 242], fill=c)
    d.text((W - 430, 214), "Inbox  ·  Day 1", font=font("segoeui.ttf", 28), fill=(110, 110, 110))
    d.text((150, 304), "From: Ginger-Eke Chienyegom", font=font("segoeui.ttf", 28), fill=(120, 120, 120))
    f, lines = fit(d, title, "segoeuib.ttf", W - 330, 4, 74)
    y = 366
    for ln in lines:
        d.text((150, y), ln, font=f, fill=INK)
        y += int(f.size * 1.15)
    for k in range(3):
        d.rounded_rectangle([150, y + 30 + k * 44, 150 + rnd.randint(520, 860), y + 52 + k * 44], 10, fill=(206, 206, 200))
    days = 7
    m = re.search(r"(\d+)[- ]day", title, re.I)
    if m and 2 <= int(m.group(1)) <= 14:
        days = int(m.group(1))
    x0, py = 110, 980
    for i in range(min(days, 7)):
        done = i < 3
        d.rounded_rectangle([x0, py, x0 + 140, py + 74], 37, fill=accent if done else None, outline=accent, width=4)
        d.text((x0 + 70, py + 36), f"Day {i + 1}", font=font("segoeuib.ttf", 28), fill=INK if done else accent, anchor="mm")
        x0 += 152
        if x0 > W - 250:
            x0, py = 110, py + 100
    footer(im, x=110, y=H - 190)
    return im


def listicle(title, cat, base, light, accent, rnd):
    im = gradient(base, light).convert("RGBA")
    im = Image.alpha_composite(im, pattern(accent, rnd, "diagonals", 38)).convert("RGB")
    d = ImageDraw.Draw(im)
    n = lead_number(title)
    label(d, f"LISTICLE  /  {cat.upper()}", 100, 100, accent)
    rest = title
    if n:
        rest = re.sub(r"^\s*\d{1,3}\s*", "", title)
        nf = font("impact.ttf", 640 if len(n) == 1 else 520 if len(n) == 2 else 400)
        d.text((86, 120), n, font=nf, fill=accent)
        ty = 860
    else:
        d.text((86, 150), "#", font=font("impact.ttf", 520), fill=accent)
        ty = 760
    f, lines = fit(d, rest, "impact.ttf", W - 200, 5, 100, 56)
    for ln in lines:
        d.text((100, ty), ln.upper(), font=f, fill=WHITE)
        ty += int(f.size * 1.08)
    footer(im, x=100, y=H - 180)
    return im


def promptpack(title, cat, base, light, accent, rnd):
    im = Image.new("RGB", (W, H), (9, 11, 13))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W - 700, -200, W + 300, 800], fill=(*accent, 80))
    im = Image.alpha_composite(im.convert("RGBA"), glow.filter(ImageFilter.GaussianBlur(140))).convert("RGB")
    d = ImageDraw.Draw(im)
    label(d, "PROMPT PACK", 100, 100, accent)
    f, lines = fit(d, title, "segoeuib.ttf", W - 200, 4, 92)
    y = 170
    for ln in lines:
        d.text((100, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.14)
    top = max(y + 50, 560)
    d.rounded_rectangle([100, top, W - 100, top + 640], 24, fill=(18, 22, 26), outline=(*accent,), width=3)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([140 + i * 42, top + 30, 162 + i * 42, top + 52], fill=c)
    mono = font("consola.ttf", 34)
    yy = top + 100
    for i in range(1, 8):
        d.text((140, yy), f"[{i:02d}]", font=mono, fill=accent)
        d.rounded_rectangle([260, yy + 10, 260 + rnd.randint(380, 760), yy + 30], 10, fill=(60, 68, 76))
        yy += 62
    d.text((140, yy + 10), "> _", font=mono, fill=accent)
    footer(im, x=100, y=H - 170)
    return im


def toolstack(title, cat, base, light, accent, rnd):
    im = gradient(base, light).convert("RGBA")
    im = Image.alpha_composite(im, pattern(accent, rnd, "grid", 50)).convert("RGB")
    d = ImageDraw.Draw(im)
    label(d, "TOOLSTACK", 100, 100, accent)
    f, lines = fit(d, title, "segoeuib.ttf", W - 200, 4, 92)
    y = 170
    for ln in lines:
        d.text((100, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.14)
    top = max(y + 50, 560)
    for r in range(3):
        for c in range(3):
            x0, y0 = 100 + c * 340, top + r * 300
            d.rounded_rectangle([x0, y0, x0 + 300, y0 + 260], 36, fill=tuple(min(255, v + 18) for v in base), outline=accent, width=3)
            d.ellipse([x0 + 100, y0 + 50, x0 + 200, y0 + 150], fill=accent if (r + c) % 2 == 0 else None, outline=accent, width=6)
            d.rounded_rectangle([x0 + 60, y0 + 190, x0 + 240, y0 + 210], 10, fill=(120, 130, 140))
    footer(im, x=100, y=H - 150)
    return im


def bundle(title, kind, cat, base, light, accent, rnd):
    gold = (226, 168, 52)
    im = gradient((10, 12, 11), base).convert("RGBA")
    im = Image.alpha_composite(im, pattern(gold, rnd, "rings", 40)).convert("RGB")
    d = ImageDraw.Draw(im)
    for k, off in enumerate((120, 60, 0)):  # stacked cards = a collection
        d.rounded_rectangle([160 + off, 330 - off, 880 + off, 1000 - off], 28, fill=tuple(int(c * (0.5 + 0.25 * k)) for c in light),
                            outline=gold if k == 2 else None, width=4)
    label(d, kind.upper().replace("·", "/"), 100, 100, gold)
    f, lines = fit(d, title, "georgiab.ttf", 620, 6, 92)
    y = 400
    for ln in lines:
        d.text((220, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.16)
    d.rectangle([220, y + 20, 440, y + 28], fill=gold)
    footer(im, x=100, y=H - 190)
    return im


TEMPLATES = {"Book": book, "Guide": guide, "Checklist": checklist, "Mini-Course": minicourse,
             "Listicle": listicle, "Prompt Pack": promptpack, "Toolstack": toolstack}


EMOJI_RE = re.compile("[\U00010000-\U0010ffff☀-➿⬀-⯿️‍]")


def clean_title(title):
    """Source titles sometimes carry emoji; the cover fonts have no glyph for them and draw an empty box."""
    return re.sub(r"\s+", " ", EMOJI_RE.sub("", title)).strip()


def make_cover(title, kind, category):
    """kind is the product format ('Book', 'Guide', ...) or 'Bundle · N items'."""
    title = clean_title(title)
    category = category or "General"
    base, light, accent = palette(category)
    rnd = rng_for(title)
    if kind.startswith("Bundle"):
        im = bundle(title, kind, category, base, light, accent, rnd)
    else:
        im = TEMPLATES.get(kind, book)(title, category, base, light, accent, rnd)
    return noise(im.convert("RGB"), 9)
