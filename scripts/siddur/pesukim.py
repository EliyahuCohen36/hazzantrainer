"""Puts the te'amim and ma'amids of the Tanach on every pasuk quoted in the Siddur.

Each paragraph's words are matched (by their letters only) against every pasuk of
Tanach (src/data/torah + src/data/tanakh, MAM). A run of 5 or more words that
matches one pasuk, or runs on through the pesukim after it, or a whole pasuk of
3+ words, is a quotation: those words are written as in MAM, with nikkud,
te'amim and ma'amid. Hashem's name keeps the Siddur's spelling (יְהֹוָה) with
MAM's ta'am added. The Siddur's own punctuation and maqafs are kept.
"""
import json, re, pathlib, collections  # noqa: E401

ROOT = pathlib.Path(__file__).resolve().parents[2]
FINALS = str.maketrans("ךםןףץ", "כמנפצ")
ACC = re.compile("[֑-ֽ֯]")


def letters(w):
    return re.sub("[^א-ת]", "", w).translate(FINALS)


def norm(w):
    """Letters without ו and י (so full and short spellings, דָּוִד / דָּוִיד, still match)."""
    l = letters(w)
    return re.sub("[וי]", "", l) or l


VREF = []  # (book slug, part, chapter, verse) of each entry in VERSES


def load_verses():
    verses = []  # (book, words_display, words_norm)
    files = sorted((ROOT / "src/data/torah").glob("*.json")) + sorted((ROOT / "src/data/tanakh").glob("*.json"))
    for f in files:
        if f.name == "chapters.json":
            continue
        for v in json.load(open(f)):
            disp = []
            for t in v["t"]:
                if isinstance(t, dict):
                    t = t["q"]
                if t == "|":
                    # Pesik / legarmeh line: keep it after the word (Azla / Mehuppakh Legarmeh,
                    # Shalshelet Gedola, Shofar Holekh with Pesik).
                    if disp and not disp[-1].endswith("׀"):
                        disp[-1] += " ׀"
                    continue
                if not t or t == "_" or t.startswith("¶") or t == "׆":
                    continue
                for piece in t.replace("־", "־ ").split():
                    w = re.sub("[{}\\[\\]<>׃]", "", piece).replace("־", "")
                    if norm(w):
                        disp.append(w)
            verses.append((f.stem, disp, [norm(w) for w in disp]))
            VREF.append((f.stem, v.get("s", 0), v["c"], v["v"]))
    return verses


VERSES = load_verses()
INDEX = collections.defaultdict(list)
for vi, (_, _, n) in enumerate(VERSES):
    for k in range(len(n) - 2):
        INDEX[(n[k], n[k + 1], n[k + 2])].append((vi, k))


def add_accents(siddur_word, mam_word):
    """Hashem's name: the Siddur's letters and vowels, with MAM's ta'am/ma'amid on the same letter."""
    def clusters(w):
        out = []
        for ch in w:
            if "א" <= ch <= "ת":
                out.append(ch)
            elif out:
                out[-1] += ch
        return out
    a, b = clusters(siddur_word), clusters(mam_word)
    if len(a) != len(b):
        return siddur_word
    return "".join(x + "".join(ACC.findall(y)) for x, y in zip(a, b))


LAST_REFS = {}  # siddur index → index in VERSES, from the last match() call


def match(words):
    """words: normalized siddur words. Returns {siddur index: mam display word}."""
    out = {}
    LAST_REFS.clear()
    i = 0
    n = len(words)
    while i < n - 2:
        best = (0, None)
        for vi, k in INDEX.get((words[i], words[i + 1], words[i + 2]), []):
            # Extend through this pasuk and the ones after it (same book).
            j, v, kk, run = i, vi, k, []
            while j < n:
                if kk >= len(VERSES[v][2]):
                    if v + 1 < len(VERSES) and VERSES[v + 1][0] == VERSES[v][0]:
                        v, kk = v + 1, 0
                        continue
                    break
                if VERSES[v][2][kk] != words[j]:
                    break
                run.append((VERSES[v][1][kk], v))
                j += 1
                kk += 1
            whole = k == 0 and len(run) >= len(VERSES[vi][2]) >= 3
            if (len(run) >= 5 or whole) and len(run) > best[0]:
                best = (len(run), run)
        if best[1]:
            for d, (w, v) in enumerate(best[1]):
                out[i + d] = w
                LAST_REFS[i + d] = v
            i += best[0]
        else:
            i += 1
    return out


def accent_paragraph(html):
    """Rewrite the spoken words of one paragraph (outside <small>) with MAM's te'amim."""
    parts = re.split(r"(<[^>]+>|\s+)", html)
    small = 0
    refs = []  # (part index, sub index, normalized)
    split_parts = {}
    for pi, part in enumerate(parts):
        if not part or part.isspace():
            continue
        if part.startswith("<"):
            tag = re.sub(r"[</>\s]", "", part).lower()
            if tag == "small":
                small += -1 if part.startswith("</") else 1
            continue
        if small:
            continue
        subs = part.split("־")
        split_parts[pi] = subs
        for si, s in enumerate(subs):
            if norm(s):
                refs.append((pi, si, norm(s)))
    m = match([r[2] for r in refs])
    # Words that aren't from a pasuk: a ma'amid where the stress is mil'el.
    for idx, (pi, si, nw) in enumerate(refs):
        if idx in m:
            continue
        old = split_parts[pi][si]
        lead = re.match(r"^[^א-ת\u0591-\u05C7]*", old).group(0)
        trail = re.search(r"[^א-ת\u0591-\u05C7]*$", old).group(0)
        core = old[len(lead): len(old) - len(trail) if trail else None]
        if "יהוה" not in letters(core) and core:
            split_parts[pi][si] = lead + add_maamid(core) + trail
    for idx, mam in m.items():
        pi, si, nw = refs[idx]
        old = split_parts[pi][si]
        lead = re.match(r"^[^א-ת֑-ׇ]*", old).group(0)
        trail = re.search(r"[^א-ת֑-ׇ]*$", old).group(0)
        core = old[len(lead): len(old) - len(trail) if trail else None]
        # Hashem's name keeps the Siddur's spelling; every other word is written as in the pasuk.
        new = add_accents(core, mam) if "יהוה" in letters(core) else mam
        split_parts[pi][si] = lead + new + trail
    for pi, subs in split_parts.items():
        parts[pi] = "־".join(subs)
    return "".join(parts), len(m)


# ── Ma'amid on the prayers that aren't pesukim ─────────────────────────────
# Hebrew words are mostly stressed on the last syllable (milra), so the ma'amid
# matters where the stress is earlier (mil'el). Only patterns that are reliably
# mil'el are marked:
#   segolates (מֶ֫לֶךְ, אֶ֫רֶץ, בֹּ֫קֶר, נַ֫עַר), -ַיִם/-ַיִן/-ַיִת (שָׁמַ֫יִם, בַּ֫יִת),
#   -נוּ endings (אֱלֹהֵ֫ינוּ, אָבִ֫ינוּ, שָׁמַ֫רְנוּ), -ֶיךָ / -ֶיהָ (אֱלֹהֶ֫יךָ).
SEGOL, PATAH, HIREQ, SHEVA, DAGESH = "ֶ", "ַ", "ִ", "ְ", "ּ"
FULL = set("ִֵֶַָֹֺֻ")  # a full vowel (not sheva / hataf)
METEG = "ֽ"


def _clusters(w):
    out = []
    for ch in w:
        if "א" <= ch <= "ת":
            out.append([ch, ""])
        elif out:
            out[-1][1] += ch
    return out


def _has_full(m):
    return any(c in FULL for c in m) or (DAGESH in m and False)


def stress_index(w):
    """Index of the letter to put a ma'amid on, or None (milra / not sure)."""
    c = _clusters(w)
    n = len(c)
    if n < 2 or METEG in w or ACC.search(w):
        return None
    L = lambda k: c[k][0] if 0 <= k < n else ""
    M = lambda k: c[k][1] if 0 <= k < n else ""
    # ...נוּ: the stress is on the syllable before (skip a sheva letter and a silent yod).
    if n >= 3 and L(n - 2) == "נ" and L(n - 1) == "ו" and DAGESH in M(n - 1):
        k = n - 3
        if L(k) == "י" and not _has_full(M(k)):
            k -= 1
        if SHEVA in M(k) and not _has_full(M(k)):
            k -= 1
        return k if k >= 0 and _has_full(M(k)) else None
    # ...ֶיךָ / ...ֶיהָ
    if n >= 3 and L(n - 1) in "כךה" and "ָ" in M(n - 1) and L(n - 2) == "י" and SEGOL in M(n - 3):
        return n - 3
    # ...ַיִם / ...ַיִן / ...ַיִת
    if n >= 3 and L(n - 2) == "י" and HIREQ in M(n - 2) and PATAH in M(n - 3) and L(n - 1) in "םןת" and not M(n - 1).strip(DAGESH):
        return n - 3
    # Segolates: a full vowel, then a segol (or patah under ח/ע), then a bare last letter.
    last = M(n - 1).replace(DAGESH, "").replace("ׁ", "").replace("ׂ", "").replace(SHEVA, "")
    if n >= 3 and not last and L(n - 1) not in "הוי":
        mid = M(n - 2)
        if SEGOL in mid or (PATAH in mid and L(n - 2) in "חע" and PATAH in M(n - 3)):
            k = n - 3
            if _has_full(M(k)) and SHEVA not in M(k) and L(k) not in "וי" or (L(k) == "ו" and "ֹ" in M(k)):
                return k
    return None


def add_maamid(w):
    k = stress_index(w)
    if k is None:
        return w
    c = _clusters(w)
    c[k][1] += METEG
    return "".join(x + y for x, y in c)
