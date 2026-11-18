"""Builds the Siddur translations: src/data/siddur-tr/<en|ar>/<part>.json, {"s-p": text}.

1. Pesukim: a paragraph that is mostly quoted from Tanach (found by pesukim.match)
   gets the English of the JPS 1917 translation (public domain) of those pesukim,
   verse after verse. Needs /tmp/jps.json (from github.com/embabel-worlds/realm-tanakh,
   reference/tanakh-05-verses-*.yml → {osisBook: {"c:v": {"en": …}}}).
2. Our own translations (scripts/siddur/tr/<lang>/<part>.json, {"s-p": text}, 1-based
   like the recordings) are written by hand and win over (1).
Also writes refs: {"s-p": "Tehillim 145:1–21"} so the reader can see where it's from.

Run: python3 scripts/siddur/translate.py
"""
import json, re, pathlib, sys  # noqa: E401

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import pesukim  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "src/data/siddur-tr"
HAND = pathlib.Path(__file__).parent / "tr"

OSIS = {
    "bereshit": ["Gen"], "shemot": ["Exod"], "vayikra": ["Lev"], "bamidbar": ["Num"], "devarim": ["Deut"],
    "yehoshua": ["Josh"], "shofetim": ["Judg"], "shemuel": ["1Sam", "2Sam"], "melakhim": ["1Kgs", "2Kgs"],
    "yeshayahu": ["Isa"], "yirmeyahu": ["Jer"], "yehezkel": ["Ezek"],
    "tere-asar": ["Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal"],
    "tehillim": ["Ps"], "mishle": ["Prov"], "iyov": ["Job"], "shir-hashirim": ["Song"], "ruth": ["Ruth"],
    "eikha": ["Lam"], "kohelet": ["Eccl"], "ester": ["Esth"], "daniel": ["Dan"],
    "ezra-nehemia": ["Ezra", "Neh"], "divre-hayamim": ["1Chr", "2Chr"],
}
NAMES = {
    "bereshit": "Bereshit", "shemot": "Shemot", "vayikra": "Vayikra", "bamidbar": "Bamidbar", "devarim": "Devarim",
    "yehoshua": "Yehoshua", "shofetim": "Shofetim", "shemuel": ["Shemuel I", "Shemuel II"],
    "melakhim": ["Melakhim I", "Melakhim II"], "yeshayahu": "Yeshayahu", "yirmeyahu": "Yirmeyahu",
    "yehezkel": "Yehezkel", "tere-asar": ["Hoshea", "Yoel", "Amos", "Ovadyah", "Yonah", "Mikhah", "Nahum",
    "Havakuk", "Tsefanyah", "Haggai", "Zekharyah", "Malakhi"], "tehillim": "Tehillim", "mishle": "Mishle",
    "iyov": "Iyov", "shir-hashirim": "Shir HaShirim", "ruth": "Ruth", "eikha": "Eikha", "kohelet": "Kohelet",
    "ester": "Ester", "daniel": "Daniel", "ezra-nehemia": ["Ezra", "Nehemyah"],
    "divre-hayamim": ["Divre HaYamim I", "Divre HaYamim II"],
}


def name(book, s):
    n = NAMES[book]
    return n[s] if isinstance(n, list) else n


def spoken_words(html):
    html = re.sub(r"<small>.*?</small>", " ", html, flags=re.S)
    text = re.sub(r"<[^>]+>", " ", html)
    out = []
    for piece in text.split():
        for s in piece.split("־"):
            if pesukim.norm(s):
                out.append(pesukim.norm(s))
    return out


def clean_en(t):
    t = re.sub(r"\s+", " ", t).strip()
    if len(re.findall(r"\b[A-Z]{2,}\b", t)) >= 3:  # JPS prints Shema-like verses in capitals
        t = t.lower()
        t = re.sub(r"(^|[.:;!?]\s+)([a-z])", lambda m: m.group(1) + m.group(2).upper(), t)
        t = re.sub(r"\b(lord|god|israel|i|o)\b", lambda m: m.group(1).capitalize() if len(m.group(1)) > 1 else m.group(1).upper(), t)
    return t.replace("LORD", "Lord").replace("GOD", "God")


# Kaddish (Aramaic): built from its parts, so every Kaddish in the Siddur is translated.
KADDISH = {
    "en": [
        ("יתגדל", "Magnified and sanctified be His great name in the world that He created according to His will. May He establish His kingship, make His redemption flourish and bring near His Messiah, in your lifetime and in your days and in the lifetime of all the house of Israel, swiftly and soon; and say: Amen. May His great name be blessed forever and to all eternity. Blessed and praised, glorified, exalted, uplifted, honoured, elevated and lauded be the name of the Holy One, blessed is He, beyond all the blessings, songs, praises and consolations that are uttered in the world; and say: Amen."),
        ("תתקבל", "May our prayer and our plea be accepted together with the prayers and pleas of all the house of Israel before our Father in heaven; and say: Amen."),
        ("עלישראלועלרבנן", "Upon Israel, upon our teachers, their students and all the students of their students, and upon all who study Torah here and everywhere, may there be for them and for you grace, kindness, mercy, long life, ample sustenance and redemption from their Father in heaven; and say: Amen."),
        ("יהאשלמא", "May there be abundant peace from heaven, life, plenty, salvation, consolation, rescue, healing, redemption, forgiveness, atonement, relief and deliverance, for us and for all His people Israel; and say: Amen."),
        ("עושהשלום", "He who makes peace in His heights, may He in His mercy make peace upon us and upon all His people Israel; and say: Amen."),
    ],
    "ar": [
        ("יתגדל", "ليتعظّم ويتقدّس اسمه العظيم في العالم الذي خلقه حسب مشيئته. وليُقِم ملكوته، وينبت فداءه، ويقرّب مسيحه، في حياتكم وفي أيامكم وفي حياة كل بيت إسرائيل، عاجلًا وفي وقت قريب، وقولوا: آمين. ليكن اسمه العظيم مباركًا إلى الأبد وإلى دهر الدهور. ليتبارك ويتسبّح ويتمجّد ويرتفع ويتعالى ويتبجّل ويتسامى ويتهلّل اسم القدوس، مبارك هو، فوق كل البركات والأناشيد والتسابيح والتعزيات التي تُقال في العالم، وقولوا: آمين."),
        ("תתקבל", "لتُقبل صلاتنا وطلبتنا مع صلوات وطلبات كل بيت إسرائيل أمام أبينا الذي في السماء، وقولوا: آمين."),
        ("עלישראלועלרבנן", "على إسرائيل وعلى معلّمينا وتلاميذهم وكل تلاميذ تلاميذهم، وعلى كل من يدرس التوراة هنا وفي كل مكان، لتكن لهم ولكم نعمة وإحسان ورحمة وحياة طويلة ورزق واسع وفداء من أبيهم الذي في السماء، وقولوا: آمين."),
        ("יהאשלמא", "ليكن سلام عظيم من السماء، وحياة وشبع وخلاص وتعزية ونجاة وشفاء وفداء وغفران وكفّارة وفرج وإنقاذ، لنا ولكل شعبه إسرائيل، وقولوا: آمين."),
        ("עושהשלום", "صانع السلام في أعاليه، هو برحمته يصنع السلام علينا وعلى كل شعبه إسرائيل، وقولوا: آمين."),
    ],
}


def kaddish(html, lang):
    flat = re.sub("[^א-ת]", "", re.sub(r"<small>.*?</small>", "", html, flags=re.S))
    if not flat.startswith("יתגדלויתקדש"):
        return None
    return " ".join(t for key, t in KADDISH[lang] if key in flat)


AR_TANAKH = {}  # Van Dyck Arabic of the Tanakh, by book (src/data/tanakh-tr/ar, public domain)


def main():
    jps = json.load(open("/tmp/jps.json"))
    parts = json.load(open(ROOT / "src/data/siddur/index.json"))
    slugs = [p["slug"] for p in parts] if isinstance(parts, list) else list(parts)
    OUT.mkdir(exist_ok=True)
    total = {"en": 0, "ar": 0}
    for slug in slugs:
        f = ROOT / f"src/data/siddur/{slug}.json"
        if not f.exists():
            continue
        data = json.load(open(f))
        en, refs, ar = {}, {}, {}
        for si, sec in enumerate(data["sections"]):
            for pi, html in enumerate(sec["paras"]):
                k = kaddish(html, "en")
                if k:
                    en[f"{si + 1}-{pi + 1}"] = k
                    ar[f"{si + 1}-{pi + 1}"] = kaddish(html, "ar")
                    continue
                words = spoken_words(html)
                if len(words) < 3:
                    continue
                pesukim.match(words)
                cov = len(pesukim.LAST_REFS) / len(words)
                if cov < 0.6:
                    continue
                # Verses quoted (in order), keeping those mostly said.
                counts = {}
                for v in pesukim.LAST_REFS.values():
                    counts[v] = counts.get(v, 0) + 1
                order = []
                for k in sorted(pesukim.LAST_REFS):
                    v = pesukim.LAST_REFS[k]
                    if v not in order and counts[v] >= max(2, len(pesukim.VERSES[v][2]) // 2):
                        order.append(v)
                texts, ref_list, ar_texts = [], [], []
                for v in order:
                    book, s, c, vv = pesukim.VREF[v]
                    osis = OSIS[book][s]
                    e = jps.get(osis, {}).get(f"{c}:{vv}")
                    if not e:
                        texts = []
                        break
                    texts.append(clean_en(e["en"]))
                    a = AR_TANAKH.setdefault(book, json.load(open(ROOT / f"src/data/tanakh-tr/ar/{book}.json")))
                    at = a.get(f"{c}:{vv}") or a.get(f"{s}:{c}:{vv}")
                    if at:
                        ar_texts.append(at)
                    ref_list.append((name(book, s), c, vv))
                if not texts:
                    continue
                key = f"{si + 1}-{pi + 1}"
                en[key] = " ".join(texts)
                if ar_texts:
                    ar[key] = " ".join(ar_texts)
                # "Tehillim 145:1–21; Tehillim 115:18"
                groups = []
                for n, c, vv in ref_list:
                    if groups and groups[-1][0] == n and groups[-1][1] == c and groups[-1][3] == vv - 1:
                        groups[-1][3] = vv
                    else:
                        groups.append([n, c, vv, vv])
                refs[key] = "; ".join(f"{n} {c}:{a}" + (f"–{b}" if b != a else "") for n, c, a, b in groups)
        for lang in ("en", "ar"):
            out = dict(en) if lang == "en" else dict(ar)
            hand = HAND / lang / f"{slug}.json"
            if hand.exists():
                out.update(json.load(open(hand)))
            if out or refs:
                (OUT / lang).mkdir(exist_ok=True)
                json.dump(out, open(OUT / lang / f"{slug}.json", "w"), ensure_ascii=False, indent=0)
                total[lang] += len(out)
        (OUT / "refs").mkdir(exist_ok=True)
        json.dump(refs, open(OUT / "refs" / f"{slug}.json", "w"), ensure_ascii=False, indent=0)
    print("paragraphs translated:", total)


if __name__ == "__main__":
    main()
