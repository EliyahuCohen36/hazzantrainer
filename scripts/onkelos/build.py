"""Targum Onkelos for Shnayim Mikra ve-Ehad Targum.

Source: "Targum Onkelos, vocalized according to the Yemenite Taj" from Hebrew
Wikisource (CC BY-SA), as exported by Sefaria (one pasuk per line, "Chapter N"
headings). Run: python3 scripts/onkelos/build.py <dir with the 5 .txt files>
Writes src/data/onkelos/<book>.json: { "c:v": text }.
"""
import json, pathlib, sys, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
NAMES = {"Genesis": "bereshit", "Exodus": "shemot", "Leviticus": "vayikra", "Numbers": "bamidbar", "Deuteronomy": "devarim"}
src = pathlib.Path(sys.argv[1])
for en, book in NAMES.items():
    f = next(src.glob(f"Onkelos {en}/Hebrew/*Taj*"))
    out, ch, v = {}, 0, 0
    for line in f.read_text().split("\n"):
        if line.startswith("Chapter "):
            ch, v = int(line.split()[1]), 0
        elif ch and line.strip():
            v += 1
            out[f"{ch}:{v}"] = re.sub(r"<[^>]+>", "", line.strip())
    torah = json.load(open(ROOT / "src/data/torah" / f"{book}.json"))
    keys = {f"{x['c']}:{x['v']}" for x in torah}
    print(book, len(out), len(keys), "missing:", sorted(keys - set(out), key=lambda k: tuple(map(int, k.split(":"))))[:8],
          "extra:", sorted(set(out) - keys)[:8])
    json.dump(out, open(ROOT / "src/data/onkelos" / f"{book}.json", "w"), ensure_ascii=False, separators=(",", ":"))
