"""Wide "blueprint" covers for Business Stacks (deliberately unlike the portrait gold bundle covers).

usage: python -I scripts/stack_covers.py
Reads store/lib/stacks.json and writes store/public/stacks/<slug>.jpg (1600x900).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
from covers import emblem, fit, font  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "store" / "public" / "stacks"
W, H = 1600, 900
WHITE = (240, 244, 250)


def rgb(hex_):
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def background(accent):
    base = Image.new("RGB", (W, H))
    px = base.load()
    for y in range(H):
        t = y / (H - 1)
        c = (int(5 + 6 * t), int(9 + 11 * t), int(20 + 20 * t))
        for x in range(W):
            px[x, y] = c
    im = base.convert("RGBA")
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W - 900, -150, W + 200, 800], fill=(*accent, 85))
    ImageDraw.Draw(glow).ellipse([-250, H - 350, 650, H + 350], fill=(*accent, 40))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(130)))
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(grid)
    for x in range(0, W, 40):
        g.line([x, 0, x, H], fill=(*accent, 34 if x % 200 == 0 else 15), width=1)
    for y in range(0, H, 40):
        g.line([0, y, W, y], fill=(*accent, 34 if y % 200 == 0 else 15), width=1)
    return Image.alpha_composite(im, grid)


def dashed(d, p1, p2, color, width=3, dash=16, gap=12):
    (x1, y1), (x2, y2) = p1, p2
    length = max(1.0, ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5)
    ux, uy = (x2 - x1) / length, (y2 - y1) / length
    pos = 0.0
    while pos < length:
        end = min(pos + dash, length)
        d.line([x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end], fill=color, width=width)
        pos += dash + gap


def make(stack):
    accent = rgb(stack["accent"])
    im = background(accent)
    d = ImageDraw.Draw(im)

    # left: label, title, subtitle
    d.text((90, 96), "BUSINESS STACK", font=font("consolab.ttf", 30), fill=accent)
    f, lines = fit(d, stack["title"].replace("The ", "", 1).replace(" Stack", ""), "segoeuib.ttf", 780, 3, 118, 70)
    y = 160
    for ln in lines:
        d.text((90, y), ln, font=f, fill=WHITE)
        y += int(f.size * 1.08)
    d.rectangle([90, y + 18, 290, y + 24], fill=accent)
    d.text((90, y + 52), f"{len(stack['steps'])} BUNDLES  /  ONE BUSINESS", font=font("consolab.ttf", 28), fill=(150, 165, 190))
    d.text((90, y + 96), f"FOR YOUR {stack['business'].upper()}", font=font("consolab.ttf", 24), fill=accent)

    # right: the build path, nodes climbing to the top right
    n = len(stack["steps"])
    pts = [(850 + i * 135, 690 - i * 105) for i in range(n)]
    for a, b in zip(pts, pts[1:]):
        dashed(d, a, b, (*accent, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for (x, yy) in pts:
        gd.ellipse([x - 46, yy - 46, x + 46, yy + 46], fill=(*accent, 120))
    im = Image.alpha_composite(im, glow.filter(ImageFilter.GaussianBlur(22)))
    d = ImageDraw.Draw(im)
    nf, lf = font("segoeuib.ttf", 34), font("consolab.ttf", 25)
    for i, ((x, yy), step) in enumerate(zip(pts, stack["steps"])):
        d.ellipse([x - 36, yy - 36, x + 36, yy + 36], fill=(7, 12, 26), outline=accent, width=4)
        d.text((x, yy - 2), str(i + 1), font=nf, fill=accent, anchor="mm")
        d.text((x + 52, yy - 14), step["role"].upper(), font=lf, fill=WHITE)

    em = emblem(84)
    im.alpha_composite(em, (90, H - 150))
    d.text((196, H - 128), "HelioConvert  /  Business Stacks", font=font("segoeuib.ttf", 34), fill=WHITE)

    # fine grain so the dark gradient doesn't band
    grain = Image.effect_noise((W // 2, H // 2), 36).resize((W, H)).convert("RGB")
    return Image.blend(im.convert("RGB"), grain, 9 / 255)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    stacks = json.loads((ROOT / "store" / "lib" / "stacks.json").read_text("utf-8"))
    sheet = Image.new("RGB", (3 * 540, 2 * 320), (20, 20, 20))
    for i, s in enumerate(stacks):
        img = make(s)
        img.save(OUT / f"{s['slug']}.jpg", quality=90)
        sheet.paste(img.resize((530, 298)), ((i % 3) * 540 + 5, (i // 3) * 320 + 10))
        print("wrote", f"{s['slug']}.jpg")
    sheet.save(ROOT / "brand" / "stack_covers_sheet.png")
