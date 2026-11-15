Builds src/data/scroll-layout.json: where each line of the standard 245-column,
42-line Sefer Torah starts and ends, mapped onto our own Torah text.

1. git clone https://github.com/akivajgordon/tikkun.io /tmp/tk   (MIT licence)
2. python3 align.py   (aligns tikkun.io's words with src/data/torah/*.json; writes align.json)
3. python3 build.py   (writes src/data/scroll-layout.json)

Only line positions are taken from tikkun.io; the words, spellings (Sephardic)
and marks are ours.
