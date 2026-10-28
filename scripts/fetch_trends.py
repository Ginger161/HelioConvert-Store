"""Pull real Google Trends interest-over-time for the homepage Trending section.

usage: python -I scripts/fetch_trends.py
Writes store/lib/trends.json. Values are Google's 0-100 relative index (100 = peak popularity in the window,
within each group of terms), worldwide, last 5 years, averaged to monthly points. Nothing is estimated:
a group that Google refuses is left out and the site simply hides that chart.
"""
import json
import sys
import time
import warnings
from datetime import date
from pathlib import Path

warnings.filterwarnings("ignore")
from pytrends.request import TrendReq

ROOT = Path(__file__).resolve().parent.parent
GROUPS = {
    "ai": {"label": "AI & automation", "terms": ["AI automation", "prompt engineering", "AI agents", "no-code"]},
    "income": {"label": "Income skills", "terms": ["freelancing", "passive income", "side hustle", "digital marketing"]},
    "wellness": {"label": "Wellness", "terms": ["burnout", "mental health", "habit tracker", "mindfulness"]},
}


def fetch(terms, tries=4):
    for k in range(tries):
        try:
            py = TrendReq(hl="en-US", tz=0, timeout=(10, 30))
            py.build_payload(terms, timeframe="today 5-y", geo="")
            df = py.interest_over_time()
            if df.empty:
                raise RuntimeError("empty frame")
            df = df.drop(columns=[c for c in df.columns if c == "isPartial"])
            m = df.resample("MS").mean().round(1)
            if m.index[-1].strftime("%Y-%m") == date.today().strftime("%Y-%m"):
                m = m.iloc[:-1]  # current month is incomplete; a partial value would draw a false cliff
            return {"months": [d.strftime("%Y-%m") for d in m.index], "series": {t: [float(v) for v in m[t]] for t in terms}}
        except Exception as e:  # 429s are common; back off and retry
            print(f"  retry {k + 1}: {str(e)[:80]}", flush=True)
            time.sleep(25 * (k + 1))
    return None


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    only = sys.argv[1:]  # e.g. `fetch_trends.py income`: refetch just those groups and keep the rest of the file
    path = ROOT / "store" / "lib" / "trends.json"
    out = json.loads(path.read_text("utf-8")) if only and path.exists() else {"fetched": date.today().isoformat(), "source": "Google Trends", "geo": "Worldwide", "window": "5 years", "groups": {}}
    out["scale"] = "each term scaled to its own peak (100)"
    for key, g in GROUPS.items():
        if only and key not in only:
            continue
        print("fetching", key, flush=True)
        series, months = {}, None
        for term in g["terms"]:  # one request per term: a high-volume term would otherwise flatten the others to ~0
            data = fetch([term])
            if data and (months is None or data["months"] == months):
                months = data["months"]
                series[term] = data["series"][term]
            time.sleep(12)
        if len(series) >= 2:
            out["groups"][key] = {"label": g["label"], "months": months, "series": series}
            print("  ok", {t: (round(v[0]), round(max(v)), round(v[-1])) for t, v in series.items()}, flush=True)
    path.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print("saved groups:", list(out["groups"]))
