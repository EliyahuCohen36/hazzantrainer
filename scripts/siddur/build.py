"""The Siddur (nusach Edot HaMizrah) for the Tefillah section.

Source: Siddur Edot HaMizrach, "Torat Emet 357" (Torat Emet freeware,
toratemetfreeware.com), as exported by Sefaria (one paragraph per line, the
parts and sections as plain heading lines). Run:
  python3 scripts/siddur/build.py "<Torat Emet 357.txt>"
Writes src/data/siddur/index.json (parts and sections) and src/data/siddur/<part>.json.
Paragraphs keep only <b>, <small> and <br> (instructions are <small>).
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/siddur"
SLUGS = {
    "סדר השכמת הבוקר": ("morning", "Upon Waking"), "סדר תיקון חצות": ("tikkun-hatsot", "Tikkun Hatsot"),
    "שחרית לימי החול": ("shaharit", "Shaharit (weekdays)"), "תוספות לשחרית": ("after-shaharit", "After Shaharit"),
    "מנחה לימי החול": ("minha", "Minha (weekdays)"), "ערבית לימי החול": ("arvit", "Arvit (weekdays)"),
    "ערבית של שבת": ("arvit-shabbat", "Arvit of Shabbat"), "סדר ליל שבת": ("leil-shabbat", "Friday Night"),
    "שחרית של שבת": ("shaharit-shabbat", "Shaharit of Shabbat"), "מוסף של שבת": ("musaf-shabbat", "Musaf of Shabbat"),
    "סדר סעודה שניה": ("seuda-sheniya", "The Shabbat Day Meal"), "מנחה של שבת": ("minha-shabbat", "Minha of Shabbat"),
    "מוצאי שבת": ("motsae-shabbat", "Motsa'e Shabbat"), "סדר ראש חודש": ("rosh-hodesh", "Rosh Hodesh"),
    "תפילה לשלש רגלים": ("regalim", "The Three Festivals"), "חנוכה": ("hanukka", "Hanukka"), "פורים": ("purim", "Purim"),
    "חודש ניסן": ("nisan", "The Month of Nisan"), "ברכות ותפילות שונות": ("berakhot", "Blessings and Prayers"),
    "תעניות ואבילות": ("taaniyot", "Fasts and Mourning"), "משניות לשבת": ("mishnayot-shabbat", "Mishnayot for Shabbat"),
}

lines = [l.rstrip() for l in open(sys.argv[1], encoding="utf-8").read().split("\n")][6:]
lines = [l.strip() for l in lines if l.strip()]
plain = lambda l: "<" not in l and len(l) < 70 and not re.search("[ְ-ּ]", l)


def clean(html):
    html = re.sub(r"<(?!/?(b|small|br)\b)[^>]*>", "", html)
    html = re.sub(r"<br\s*/?>", "<br>", html)
    return html.strip()


parts, cur_part, cur_sec = [], None, None
for i, l in enumerate(lines):
    if plain(l):
        if i + 1 < len(lines) and plain(lines[i + 1]):
            slug, en = SLUGS.get(l.strip(), (f"part-{len(parts) + 1}", l))
            cur_part = {"slug": slug, "he": l.strip(), "en": en, "sections": []}
            parts.append(cur_part)
        else:
            cur_sec = {"he": l.strip().rstrip(":"), "paras": []}
            cur_part["sections"].append(cur_sec)
        continue
    if cur_sec is None:
        continue
    t = clean(l)
    # Big headings repeat the section's name: keep them out of the paragraphs.
    if re.fullmatch(r"(<b>)?\s*[^<]*\s*(</b>)?", t) and "<big>" in l:
        continue
    if t:
        cur_sec["paras"].append(t)

# ── The owner's corrections ─────────────────────────────────────────────
def letters_only(h):
    return re.sub(r"\s+", " ", re.sub("[\u0591-\u05C7]", "", re.sub("<[^>]+>", "", h))).strip()


for p in parts:
    for sec in p["sections"]:
        paras = sec["paras"]
        # A prayer printed small (Mimaamakim, the Kaddish…) is still said: unwrap it so it
        # has its own recording slot. Its bold first word shows it's prayer text.
        for k, h in enumerate(paras):
            m = re.match(r"^\s*<small>(\s*<b>[\s\S]*)</small>\s*$", h)
            if m and m.group(1).count("<small>") == m.group(1).count("</small>"):
                paras[k] = m.group(1).strip()
        # Ashre and Tehillah LeDavid: one part.
        k = 0
        while k < len(paras) - 1:
            a, b = letters_only(paras[k]), letters_only(paras[k + 1])
            if a.startswith("אשרי יושבי ביתך") and b.startswith("תהלה לדוד") and len(a) < 120:
                paras[k] = paras[k] + "<br>" + paras.pop(k + 1)
            k += 1
        # Shabbat: כי ליהוה המלוכה and נשמת כל חי, one part (with the note between them).
        if p["slug"] == "shaharit-shabbat":
            for k in range(len(paras) - 2):
                if letters_only(paras[k]).startswith("כי ליהוה המלוכה"):
                    j = next((j for j in range(k + 1, min(k + 3, len(paras))) if letters_only(paras[j]).startswith("נשמת כל חי")), None)
                    if j:
                        paras[k] = "<br>".join(paras[k : j + 1])
                        del paras[k + 1 : j + 1]
                    break

# Te'amim and ma'amids from the Tanach on every pasuk; ma'amids on mil'el words elsewhere.
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pesukim  # noqa: E402

total = 0
for p in parts:
    for sec in p["sections"]:
        for k, h in enumerate(sec["paras"]):
            sec["paras"][k], n = pesukim.accent_paragraph(h)
            total += n
print("words given their pasuk's te'amim:", total)

OUT.mkdir(parents=True, exist_ok=True)
index = []
for p in parts:
    json.dump(p, open(OUT / f"{p['slug']}.json", "w"), ensure_ascii=False, separators=(",", ":"))
    index.append({"slug": p["slug"], "he": p["he"], "en": p["en"],
                  "sections": [{"he": s["he"], "n": len(s["paras"])} for s in p["sections"]]})
json.dump(index, open(OUT / "index.json", "w"), ensure_ascii=False, indent=1)
for p in index: print(p["slug"], len(p["sections"]), sum(s["n"] for s in p["sections"]))
