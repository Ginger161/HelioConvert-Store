import sys, warnings
warnings.filterwarnings("ignore")
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image
from covers import make_cover, W, H

samples = [
    ("The Smart Homebuyer’s Playbook", "Book", "Special Topics"),
    ("Run Your Four-Week Driver Reset", "Guide", "Habits"),
    ("The Instagram Profile Setup Audit", "Checklist", "Content Creation"),
    ("Build Your Self-Trust in 7 Days", "Mini-Course", "Personal Growth"),
    ("13 Instagram Mistakes Quietly Killing Your Reach", "Listicle", "Digital Marketing"),
    ("AI Influencer Operations", "Prompt Pack", "AI"),
    ("Content Creation on Instagram", "Bundle · 7 items", "Content Creation"),
    ("The Automation Toolstack for Small Teams", "Toolstack", "Automation"),
]
tw, th = 400, 533
sheet = Image.new("RGB", (tw * 4 + 50, th * 2 + 30), (20, 20, 20))
for i, (t, k, c) in enumerate(samples):
    im = make_cover(t, k, c).resize((tw, th))
    sheet.paste(im, (10 + (i % 4) * (tw + 10), 10 + (i // 4) * (th + 10)))
sheet.save("brand/cover_sheet.png")
print("ok")
