"""Build the store's icon set from the HelioConvert emblem.

usage: python -I scripts/make_icons.py
Writes store/app/favicon.ico, store/app/icon.png, store/app/apple-icon.png (Next.js serves these automatically).
Each sits on a dark rounded tile so the emblem stays readable on light and dark browser tabs, even at 16px.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "store" / "app"
TILE = (9, 14, 12, 255)  # the store's background tone


def tile(size, rounded=True, pad=0.07):
    """Emblem centred on a dark tile, drawn large then scaled down so edges stay clean."""
    big = 1024
    emblem = Image.open(ROOT / "brand" / "logo.png").convert("RGBA").crop((380, 290, 1100, 1010))
    inner = int(big * (1 - 2 * pad))
    emblem = emblem.resize((inner, inner), Image.LANCZOS)
    base = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=TILE)
    else:
        d.rectangle([0, 0, big, big], fill=TILE)
    base.alpha_composite(emblem, ((big - inner) // 2, (big - inner) // 2))
    return base.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    tile(512).save(APP / "icon.png")
    tile(180, rounded=False, pad=0.12).save(APP / "apple-icon.png")  # iOS applies its own rounded mask
    tile(256).save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    for f in ("favicon.ico", "icon.png", "apple-icon.png"):
        im = Image.open(APP / f)
        print(f, im.size, im.info.get("sizes") or "")
