"""Practice words for Beginner Keriah, taken from the Torah text.

For each nekuda level (5 = qamats/patah ... 10 = hataf) it keeps real Torah words
that use only the nekudot learned up to that level (no sheva, no qamats qatan,
no furtive patah, no names of Hashem), with the syllables the site uses to sound
the word out from the Hazzan's recordings.

Run:  python3 scripts/beginner-words/build.py   ->  src/data/beginner-words.json
"""
import json, re, collections, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
BOOKS = ["bereshit", "shemot", "vayikra", "bamidbar", "devarim"]

SHEVA, HSEGOL, HPATAH, HQAMATS = "ְ", "ֱ", "ֲ", "ֳ"
HIREQ, SERE, SEGOL, PATAH, QAMATS = "ִ", "ֵ", "ֶ", "ַ", "ָ"
HOLEM, HOLEM_VAV, QIBBUS, DAGESH = "ֹ", "ֺ", "ֻ", "ּ"
SHIN_DOT, SIN_DOT, QAMATS_QATAN = "ׁ", "ׂ", "ׇ"
VOWELS = {QAMATS: "qamats", PATAH: "patah", SERE: "sere", SEGOL: "segol", HIREQ: "hireq",
          HOLEM: "holem", QIBBUS: "qibbus", HPATAH: "hataf-patah", HSEGOL: "hataf-segol",
          HQAMATS: "hataf-qamats", SHEVA: "sheva", QAMATS_QATAN: "qamats-qatan", HOLEM_VAV: "holem"}
SOUND = {"qamats": "qamats", "patah": "qamats", "hataf-patah": "qamats", "sere": "sere", "segol": "sere",
         "hataf-segol": "sere", "hireq": "hireq", "hireq-male": "hireq", "holem": "holem",
         "holem-male": "holem", "hataf-qamats": "holem", "qibbus": "qibbus", "shuruq": "qibbus"}
LEVEL = {"qamats": 5, "patah": 5, "sere": 6, "segol": 6, "hireq": 7, "hireq-male": 7, "holem": 8,
         "holem-male": 8, "qibbus": 9, "shuruq": 9, "hataf-patah": 10, "hataf-segol": 10, "hataf-qamats": 10}
LETTER = {"א": "alef", "ג": "gimel", "ד": "dalet", "ה": "he", "ו": "vav", "ז": "zayin", "ח": "het",
          "ט": "tet", "י": "yod", "ל": "lamed", "מ": "mem", "ם": "mem", "נ": "nun", "ן": "nun",
          "ס": "samekh", "ע": "ayin", "צ": "tsadi", "ץ": "tsadi", "ק": "qof", "ר": "resh", "ת": "tav"}
DROP = re.compile("[֑-ֽֿ֯׀׃-׆{}\\[\\]׃]")
is_letter = lambda ch: "א" <= ch <= "ת"


class Skip(Exception):
    pass


def letter_id(ch, marks):
    if ch in "בכךפף":
        hard = DAGESH in marks
        return {"ב": ("bet", "vet"), "כ": ("kaf", "khaf"), "ך": ("kaf", "khaf"),
                "פ": ("pe", "fe"), "ף": ("pe", "fe")}[ch][0 if hard else 1]
    if ch == "ש":
        if SHIN_DOT in marks:
            return "shin"
        if SIN_DOT in marks:
            return "sin"
        raise Skip
    return LETTER[ch]


def analyze(word):
    """-> (syllables, nekudot used) or raises Skip."""
    cl = []
    for ch in word:
        if is_letter(ch):
            cl.append([ch, ""])
        elif cl:
            cl[-1][1] += ch
        else:
            raise Skip
    syl, used, i = [], set(), 0
    while i < len(cl):
        ch, marks = cl[i]
        vs = [VOWELS[m] for m in marks if m in VOWELS]
        if len(vs) > 1 or "sheva" in vs or "qamats-qatan" in vs:
            raise Skip
        last = i == len(cl) - 1
        nxt = cl[i + 1] if not last else None
        if ch == "ו" and not vs and DAGESH in marks:
            raise Skip  # shuruq not straight after a consonant (e.g. word-initial וּ)
        if ch == "ו" and HOLEM in marks and not set(marks) - {HOLEM}:
            raise Skip  # holem male that isn't after a bare consonant
        lid = letter_id(ch, marks)
        if vs:
            v = vs[0]
            if last and v == "patah" and (ch in "חע" or (ch == "ה" and DAGESH in marks)) and syl:
                raise Skip  # furtive patah
            if v == "hireq" and nxt and nxt[0] == "י" and not any(m in VOWELS or m == DAGESH for m in nxt[1]):
                v = "hireq-male"
                i += 1  # the yod is silent
            syl.append(f"{lid}:{SOUND[v]}")
            used.add(v)
        elif nxt and nxt[0] == "ו" and nxt[1] in (HOLEM, DAGESH):
            v = "holem-male" if nxt[1] == HOLEM else "shuruq"
            syl.append(f"{lid}:{SOUND[v]}")
            used.add(v)
            i += 1
        elif ch == "י" and syl and syl[-1].split(":")[-1] in ("sere", "hireq"):
            pass  # silent yod after sere / segol (also at the end: אֲחֵי = "a-he")
        elif last:
            if ch in "אה":
                if DAGESH in marks:
                    raise Skip  # mappiq
            else:
                syl.append(lid)
        elif ch == "א":
            pass  # silent alef
        else:
            raise Skip
        i += 1
    if not used:
        raise Skip
    return syl, used


def hashem(word):
    bare = re.sub("[^א-ת]", "", word)
    return ("יהוה" in bare or "אדני" in bare or re.fullmatch("[והלבכמש]?אלה(ים|י|יך|יכם|יהם|ינו|יו)?", bare) is not None
            or bare in ("אל", "שדי"))


count = collections.Counter()
info = {}
for b in BOOKS:
    for verse in json.load(open(ROOT / f"src/data/torah/{b}.json")):
        for tok in verse["t"]:
            if not isinstance(tok, str) or tok in ("|", "_") or tok.startswith("¶"):
                continue
            for w in tok.split("־"):
                w = DROP.sub("", w)
                if not w or w in info and info[w] is None:
                    continue
                if w not in info:
                    try:
                        if hashem(w):
                            raise Skip
                        syl, used = analyze(w)
                        if not (1 <= len(syl) <= 4) or len(w.replace(DAGESH, "")) > 14:
                            raise Skip
                        info[w] = (syl, max(LEVEL[u] for u in used))
                    except Skip:
                        info[w] = None
                        continue
                count[w] += 1

by_level = collections.defaultdict(list)
for w, n in count.most_common():
    syl, lvl = info[w]
    if len(by_level[lvl]) < 120:
        by_level[lvl].append({"w": w, "s": syl})

out = {str(k): by_level[k] for k in sorted(by_level)}
(ROOT / "src/data/beginner-words.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
for k, v in out.items():
    print(k, len(v), " ".join(x["w"] for x in v[:15]))
