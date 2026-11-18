"""Practice words for the Sheva and Qamats Katan steps of Beginner Keriah.

Each item is a real Torah word with one letter to look at (`i` = index of that
letter in the word) and the answer: for a sheva "na"/"nach", for a qamats
"a"/"o". Words are shown with nikkud only (te'amim removed); a qamats gadol
followed by a sheva gets a ma'amid under it (owner's rule), and the qamats katan
is written as a plain qamats so the child uses the rule.

Run:  python3 scripts/sheva-words/build.py  ->  src/data/sheva-words.json
"""
import json, re, pathlib, collections, random

ROOT = pathlib.Path(__file__).resolve().parents[2]
BOOKS = ["bereshit", "shemot", "vayikra", "bamidbar", "devarim"]
SHEVA, QAMATS, KATAN, METEG, DAGESH = "ְ", "ָ", "ׇ", "ֽ", "ּ"
PATAH, SEGOL, HIREQ, QIBBUS, SERE = "ַ", "ֶ", "ִ", "ֻ", "ֵ"
HOLAM = "ֹֺ"
ACCENTS = re.compile("[֑-֯]")
is_letter = lambda c: "א" <= c <= "ת"
MAX = 160
random.seed(7)


def clusters(word):
    out = []
    for ch in word:
        if is_letter(ch):
            out.append([ch, ""])
        elif out:
            out[-1][1] += ch
    return out


def stress_index(cl):
    s = -1
    n = len(cl)
    for k, (l, m) in enumerate(cl):
        acc = [c for c in ACCENTS.findall(m)
               if not (c in "֮֒֙֩" and k == n - 1) and not (c in "֚֠" and k == 0)]
        if acc:
            s = k
    return s


def vowel(l, m):
    if SHEVA in m: return "sheva"
    if re.search("[ֱ-ֳ]", m): return "hataf"
    if KATAN in m: return "katan"
    if QAMATS in m: return "qamats"
    if SERE in m: return "tsere"
    if any(h in m for h in HOLAM): return "holam"
    if HIREQ in m: return "hiriq"
    if PATAH in m: return "patah"
    if SEGOL in m: return "segol"
    if QIBBUS in m: return "qibbus"
    if l == "ו" and DAGESH in m: return "shuruk"
    return "none"


def analyse(word):
    """Per letter: its vowel, with vowel letters (וֹ וּ ִי, silent אהוי) folded into the letter before."""
    cl = clusters(word)
    v = [vowel(l, m) for l, m in cl]
    n = len(cl)
    for k in range(1, n):
        l, m = cl[k]
        if l == "ו" and v[k] == "holam" and v[k - 1] == "none":
            v[k - 1], v[k] = "holam", "mater"
        elif v[k] == "shuruk" and v[k - 1] == "none":
            v[k - 1], v[k] = "shuruk-mid", "mater"
        elif v[k] == "none" and l in "אהוי" and DAGESH not in m and v[k - 1] not in ("none", "sheva"):
            if v[k - 1] == "hiriq" and l == "י": v[k - 1] = "hiriq-male"
            v[k] = "mater"
    # ־ָיו at the end ("lav"): the vav is sounded.
    if n >= 2 and cl[-1][0] == "ו" and v[-1] == "mater" and cl[-2][0] == "י" and v[-2] == "mater":
        v[-1] = "none"
    return cl, v


def display(cl, keep_katan=False):
    """Nikkud only; ma'amid under a qamats gadol that is followed by a sheva."""
    out = ""
    for k, (l, m) in enumerate(cl):
        m2 = ACCENTS.sub("", m).replace("ֽ", "")
        if not keep_katan: m2 = m2.replace(KATAN, QAMATS)
        nxt = cl[k + 1][1] if k + 1 < len(cl) else ""
        if QAMATS in m and KATAN not in m and SHEVA in nxt and k + 1 < len(cl) - 1:
            m2 += METEG
        out += l + m2
    return out


LONG = {"qamats", "tsere", "hiriq-male", "holam", "shuruk-mid"}
CONS = {"א": "", "ג": "g", "ד": "d", "ה": "h", "ו": "v", "ז": "z", "ח": "ḥ", "ט": "ṭ", "י": "y", "ל": "l",
        "מ": "m", "ם": "m", "נ": "n", "ן": "n", "ס": "s", "ע": "", "צ": "ts", "ץ": "ts", "ק": "q", "ר": "r", "ת": "t"}
VOW = {"qamats": "a", "patah": "a", "tsere": "e", "segol": "e", "hiriq": "i", "hiriq-male": "i", "holam": "o",
       "qibbus": "u", "shuruk": "u", "shuruk-mid": "u", "katan": "o"}


def sheva_na(cl, v, k, stress, last):
    if k == last or (k == last - 1 and v[last] == "sheva"): return False
    if k == 0: return True
    if DAGESH in cl[k][1]: return True
    if v[k - 1] == "sheva": return k - 1 > 0
    pk = k - 1 if v[k - 1] != "mater" else k - 2
    if pk == stress: return False
    if v[pk] == "shuruk" and pk == 0: return False
    return v[pk] in LONG


def translit(cl, v, stress, flip=None, double=None, glide=None, naive_end=False):
    """The word in simple Latin syllables ("nash-ke-nu"); flip = index whose sheva/qamats reading is swapped."""
    n = len(cl)
    last = n - 1
    while last > 0 and v[last] == "mater": last -= 1
    syl = []
    for k, (l, m) in enumerate(cl):
        if v[k] == "mater": continue
        if l in "בכךפף":
            c = {"ב": "b", "כ": "k", "ך": "k", "פ": "p", "ף": "p"}[l] if DAGESH in m else {"ב": "v", "כ": "kh", "ך": "kh", "פ": "f", "ף": "f"}[l]
        elif l == "ש":
            c = "s" if "ׂ" in m else "sh"
        else:
            c = CONS.get(l, "")
        if l == "ה" and k == last and v[k] == "none" and DAGESH not in m: c = ""
        if l == "ה" and k == last and DAGESH in m: c = "h"
        if k == 0 and v[k] == "shuruk": c = ""  # וּ at the start of a word is just "u"
        vw = v[k]
        if vw == "hataf":
            sound = "a" if "ֲ" in m else "e" if "ֱ" in m else "o"
        elif vw == "sheva":
            na = sheva_na(cl, v, k, stress, last)
            if flip == k: na = not na
            # A qamats read the other way changes the sheva after it too.
            if flip == k - 1 and v[k - 1] == "qamats": na = False
            if flip == k - 1 and v[k - 1] == "katan": na = True
            sound = "e" if na else None
        elif vw in VOW:
            sound = VOW[vw]
            if flip == k and vw in ("qamats", "katan"): sound = "o" if sound == "a" else "a"
        else:
            sound = None
        if double == k and syl and sound is not None:
            syl[-1] = (syl[-1][0] + c, None)  # dagesh hazaq: the letter is said twice ("hash-sha")
        genuva = k == last and vw == "patah" and (l in "חע" or (l == "ה" and DAGESH in m))
        if genuva and naive_end:
            syl.append((c + "a", True)); continue  # the wrong way: the Patah read after the letter
        if genuva:
            syl.append(((glide or "") + "a" + c, True)); continue  # Patah Genuva: said before the letter
        if sound is None:
            if syl: syl[-1] = (syl[-1][0] + c, None)
            else: syl.append((c, None))
        else:
            syl.append((c + sound, True))
    out = "-".join(x[0] for x in syl if x[0])
    return out


items = collections.defaultdict(dict)  # category -> word -> item
for b in BOOKS:
    for verse in json.load(open(ROOT / "src/data/torah" / f"{b}.json")):
        for tok in verse["t"]:
            if not isinstance(tok, str) or tok in ("|", "_") or tok.startswith("¶"): continue
            for piece in tok.split("־"):
                w = re.sub("[׃{}\\[\\]<>׀]", "", piece)
                if not w or "יהוה" in re.sub("[^א-ת]", "", w): continue
                cl, v = analyse(w)
                n = len(cl)
                if n < 2: continue
                plain = re.sub("[^א-ת]", "", w)
                stress = stress_index(cl)
                last = n - 1
                while last > 0 and v[last] == "mater": last -= 1
                shevas = [k for k in range(n) if v[k] == "sheva"]
                maqaf_after = piece != tok.split("־")[-1]
                # ── Qamats katan
                for k in range(n):
                    if v[k] == "katan":
                        nxt = v[k + 1] if k + 1 < n else ""
                        cat = "katan-maqaf" if maqaf_after and k >= last - 1 else ("katan-sheva" if nxt == "sheva" else None)
                        if cat:
                            items[cat].setdefault(plain, {"_src": (cl, v, stress), "w": display(cl) + ("־" if cat == "katan-maqaf" else ""), "i": k, "a": "o", "k": cat})
                    if v[k] == "qamats" and k + 1 < n and v[k + 1] == "sheva":
                        items["gadol-sheva"].setdefault(plain, {"_src": (cl, v, stress), "w": display(cl), "i": k, "a": "a", "k": "gadol-sheva"})
                # ── Sheva (a qamats katan elsewhere in the word keeps its mark)
                D = display(cl, keep_katan=True)
                if len(shevas) == 2 and shevas[1] == shevas[0] + 1 and 0 < shevas[0] and shevas[1] < last:
                    items["two-middle"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": shevas[1], "a": "na", "k": "two-middle", "j": shevas[0]})
                if len(shevas) != 1:
                    if len(shevas) == 2 and shevas[1] == last and shevas[0] == last - 1:
                        items["end"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": shevas[1], "a": "nach", "k": "end", "j": shevas[0]})
                    continue
                k = shevas[0]
                l, m = cl[k]
                if k == last:
                    items["end"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": k, "a": "nach", "k": "end"}); continue
                if k == 0:
                    items["na-start"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": k, "a": "na", "k": "na-start"}); continue
                if DAGESH in m:
                    # A Sheva on a letter with a dagesh is always Na (not on the last letters: those are Nach).
                    items["na-dagesh"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": k, "a": "na", "k": "na-dagesh"})
                    continue
                pk = k - 1 if v[k - 1] != "mater" else k - 2
                pv = v[pk]
                if pk == stress: continue  # closes the stressed syllable: nach by the stress rule
                if pv == "shuruk" and pk == 0:
                    items["nach-u"].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": k, "a": "nach", "k": "nach-u"}); continue
                cat = {"patah": "nach-patah", "segol": "nach-segol", "hiriq": "nach-hiriq", "katan": "nach-katan",
                       "qibbus": "nach-qibbus", "qamats": "na-qamats", "tsere": "na-tsere", "hiriq-male": "na-hiriq",
                       "holam": "na-holam", "shuruk-mid": "na-shuruk"}.get(pv)
                if not cat: continue
                items[cat].setdefault(plain, {"_src": (cl, v, stress), "w": D, "i": k, "a": cat.split("-")[0], "k": cat})


# ── Patah Genuva, Dagesh Kal / Hazaq, the four kinds of He (steps 8–10) ──────────────────
SHORT = {"patah", "segol", "hiriq", "qibbus", "katan"}
W_BEFORE = {"holam", "shuruk-mid", "qibbus", "katan", "shuruk"}
Y_BEFORE = {"tsere", "segol", "hiriq", "hiriq-male"}
BGDKPT = "בגדכפת"
GUTTURAL = "אהחער"
# He HaShe'elah: checked by hand (a הֲ that is part of a hif'il verb or a name is left out).
SHEELAH = set("""הידוע התשחית השמע היד הלוא היקרך הרפה הזה הבת הגוי היכל הנהיה המלך הגם הישכם הבוא הכי
הטרם השלום השמר הצאן הרק היפלא הטובה הלא השפט הנשמע התחת הנמצא היש המן הילך התשמר המבלי הנסה התלכי""".split())
SHEELAH_NOT = {"המון", "הדר", "הלך", "הרג", "הרס", "הרה", "הגר", "הלם", "הדם", "הדרם", "הרגו", "הרגני", "הריה", "הרת", "הלבן"}
genuva, extra = collections.defaultdict(dict), collections.defaultdict(dict)
for b in BOOKS:
    for verse in json.load(open(ROOT / "src/data/torah" / f"{b}.json")):
        for tok in verse["t"]:
            if not isinstance(tok, str) or tok in ("|", "_") or tok.startswith("¶"): continue
            pieces = tok.split("־")
            for pidx, piece in enumerate(pieces):
                w = re.sub("[׃{}\\[\\]<>׀]", "", piece)
                letters_only = re.sub("[^א-ת]", "", w)
                if not w or "יהוה" in letters_only: continue
                cl, v = analyse(w)
                n = len(cl)
                if n < 2: continue
                stress = stress_index(cl)
                last = n - 1
                while last > 0 and v[last] == "mater": last -= 1
                D = display(cl, keep_katan=True)
                no_sheva = not any(x == "sheva" for x in v)  # Patah Genuva / Dagesh: no Sheva question in the way
                # Patah Genuva
                l, m = cl[-1]
                if no_sheva and v[-1] == "patah" and (l in "חע" or (l == "ה" and DAGESH in m)) and n >= 2:
                    pk = n - 2 if v[n - 2] != "mater" else n - 3
                    if pk >= 0:
                        g = "w" if v[pk] in W_BEFORE else "y" if v[pk] in Y_BEFORE else None
                        if g:
                            cat = f"genuva-{g}"
                            genuva[cat].setdefault(letters_only, {"_src": (cl, v, stress), "w": D, "i": n - 1, "a": g, "k": cat})
                # Dagesh Kal: a בגדכפת at the start of the word with a dagesh
                if no_sheva and cl[0][0] in BGDKPT and DAGESH in cl[0][1] and pidx == 0:
                    extra["dagesh-kal"].setdefault(letters_only, {"_src": (cl, v, stress), "w": D, "i": 0, "a": "kal", "k": "dagesh-kal"})
                # Dagesh Hazaq: a dagesh right after a short vowel
                for k in range(1, last + 1 if no_sheva else 0):
                    lk, mk = cl[k]
                    if DAGESH not in mk or v[k] in ("shuruk", "shuruk-mid", "mater") or (lk == "ה" and k == last): continue
                    if v[k - 1] in SHORT:
                        extra["dagesh-hazaq"].setdefault(letters_only, {"_src": (cl, v, stress), "w": D, "i": k, "a": "hazaq", "k": "dagesh-hazaq"})
                        break
                # The four kinds of He
                f0, m0 = cl[0]
                if f0 == "ה" and pidx == 0 and n >= 3:
                    if PATAH in m0 and DAGESH in cl[1][1] and cl[1][0] not in GUTTURAL:
                        extra["he-yediah"].setdefault(letters_only, {"w": D, "i": 0, "a": "yediah", "k": "he-yediah"})
                    elif QAMATS in m0 and cl[1][0] in "אער" and v[0] == "qamats":
                        extra["he-yediah"].setdefault(letters_only, {"w": D, "i": 0, "a": "yediah", "k": "he-yediah"})
                    elif "ֲ" in m0 and letters_only in SHEELAH:
                        extra["he-sheelah"].setdefault(letters_only, {"w": D, "i": 0, "a": "sheelah", "k": "he-sheelah"})
                if l == "ה" and DAGESH in m and QAMATS in cl[-2][1] and v[-1] == "none":
                    extra["he-mappiq"].setdefault(letters_only, {"w": D, "i": n - 1, "a": "mappiq", "k": "he-mappiq"})
                if l == "ה" and v[-1] == "mater" and QAMATS in cl[-2][1] and 0 <= stress < n - 2:
                    extra["he-megamah-cand"].setdefault(letters_only, {"w": D, "i": n - 1, "a": "megamah", "k": "he-megamah"})

# He HaMegamah: only words that mean "towards" (checked by hand from the Torah's mil'el -ָה words).
MEGAMAH = ["מצרימה", "ארצה", "השמימה", "הביתה", "צפנה", "נגבה", "קדמה", "ימה", "שמה", "ההרה", "חרנה", "שעירה",
           "כנען", "ארצהכנען", "מדברה", "המדברה", "השדה", "השדהה", "האהלה", "הפתחה", "החוצה", "חוצה", "תימנה",
           "ירדנה", "הירדנה", "צען", "גררה", "פדנהארם", "פדנה", "סדמה", "חברונה", "מזרחה", "שכמה", "אפרתה",
           "אהלה", "הארצה", "עירה", "העירה", "ביתה", "גשנה", "בבלה", "ההרהה", "סיני", "שערה", "דתינה", "תמנתה",
           "קדמהמזרחה", "השערה", "אשורה", "מצפה", "צפונה", "מעלה", "למעלה", "מטה", "למטה", "אחורנית"]
for p_, x in extra.pop("he-megamah-cand").items():
    if p_ in MEGAMAH:
        extra["he-megamah"][p_] = dict(x, k="he-megamah")

for cat, d in list(genuva.items()) + list(extra.items()):
    for x in d.values():
        src = x.pop("_src", None)
        if src is None: continue
        cl, v, stress = src
        if cat.startswith("genuva"):
            x["r"] = translit(cl, v, stress, glide=x["a"])
            x["x"] = translit(cl, v, stress, glide="y" if x["a"] == "w" else "w")
            x["y"] = translit(cl, v, stress, naive_end=True)
        elif cat == "dagesh-hazaq":
            x["r"] = translit(cl, v, stress, double=x["i"])
            x["x"] = translit(cl, v, stress)
    items[cat] = d

# Same letters read both ways (שָֽׁמְרָה / שָׁמְרָה): a qamats with a ma'amid = "a", without = "o".
both = []
katan_by = {p: x for p, x in items["katan-sheva"].items()}
for p, g in items["gadol-sheva"].items():
    if p in katan_by:
        both.append(dict(g, k="katan-both"))
        both.append(dict(katan_by[p], k="katan-both"))
# The owner's examples: the same letters, "a" with a ma'amid and "o" without.
M = METEG
for o, a, ro, ra in [
    ("שָׁמְרָה", "שָׁ" + M + "מְרָה", "shom-ra", "sha-me-ra"),
    ("אָכְלָה", "אָ" + M + "כְלָה", "okh-la", "a-khe-la"),
    ("לָמְדָה", "לָ" + M + "מְדָה", "lom-da", "la-me-da"),
]:
    both.append({"w": o, "i": 0, "a": "o", "k": "katan-both", "r": ro, "x": ra})
    both.append({"w": a, "i": 0, "a": "a", "k": "katan-both", "r": ra, "x": ro})
items["katan-both"] = {f"{x['w']}": x for x in both}
# More of the owner's examples of a qamats katan: עָרְלָה, אָרְכָּה, רָחְבָּה.
for w_, r_, x_ in [("עָרְלָה", "or-la", "a-re-la"), ("אָרְכָּהּ", "or-kah", "a-re-kah"), ("רָחְבָּהּ", "roḥ-bah", "ra-ḥe-bah")]:
    items["katan-sheva"]["!" + w_] = {"w": w_, "i": 0, "a": "o", "k": "katan-sheva", "r": r_, "x": x_}

out = {}
for cat, d in items.items():
    for x in d.values():
        src = x.pop("_src", None)
        if src is None: continue
        cl, v, stress = src
        x["r"] = translit(cl, v, stress)
        x["x"] = translit(cl, v, stress, flip=x["i"])
    lst = list(d.values())
    first = [x for k, x in d.items() if k.startswith("!")]
    rest = [x for k, x in d.items() if not k.startswith("!")]
    random.shuffle(rest)
    lst = first + rest
    out[cat] = lst[:MAX]
json.dump(out, open(ROOT / "src/data/sheva-words.json", "w"), ensure_ascii=False, separators=(",", ":"))
for cat in sorted(out): print(cat, len(items[cat]), [x["w"] for x in out[cat][:4]])
