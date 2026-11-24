/**
 * 15 words from the Torah for each ta'am (fewer where the ta'am is rare), for the Hazzan to record
 * (owner, Nov 24 2026). Run: npx tsx scripts/taam-words/build.ts → src/data/taam-words.json
 * Prefers short words (2–5 letters), different words, spread over the five books; a maqaf word is fine
 * only when nothing else is left. Words with Hashem's name are left out.
 */
import { writeFileSync } from "node:fs";
import { TORAH_TEXT } from "../../src/data/torah";
import { taamOfWord } from "../../src/lib/hebrew/taam-of-word";
import { PROSE_TEAMIM } from "../../src/data/teamim-reference";

const BOOKS = ["bereshit", "shemot", "vayikra", "bamidbar", "devarim"];
const HE: Record<string, string> = { bereshit: "Bereshit", shemot: "Shemot", vayikra: "Vayikra", bamidbar: "Bamidbar", devarim: "Devarim" };
const letters = (w: string) => w.replace(/[^א-ת]/g, "");
const HASHEM = /יהוה|אלה(?:י|ים)|אדני|שדי/;

type C = { word: string; ref: string; book: number; len: number; maqaf: boolean };
const cands: Record<string, C[]> = {};
BOOKS.forEach((b, bi) => {
  for (const v of TORAH_TEXT[b]) {
    v.t.forEach((tok, i) => {
      if (typeof tok !== "string" || !/[א-ת]/.test(tok) || /[{}[\]<>]/.test(tok)) return;
      const t = taamOfWord(tok, v.t[i + 1] === "|");
      if (!t?.id) return;
      const L = letters(tok);
      if (HASHEM.test(L)) return;
      (cands[t.id] ??= []).push({ word: tok.replace(/׃$/, ""), ref: `${HE[b]} ${v.c}:${v.v}`, book: bi, len: L.length, maqaf: tok.includes("־") });
    });
  }
});

const out: Record<string, { word: string; ref: string }[]> = {};
for (const t of PROSE_TEAMIM) {
  if (!t.id || t.hidden) continue;
  const all = cands[t.id] ?? [];
  const seen = new Set<string>();
  const pick: C[] = [];
  // Rounds: short single words first, spread over the books; then anything left.
  const tiers = [
    (c: C) => !c.maqaf && c.len >= 2 && c.len <= 5,
    (c: C) => !c.maqaf && c.len <= 7,
    (c: C) => true,
  ];
  for (const ok of tiers) {
    for (let round = 0; pick.length < 15 && round < 40; round++) {
      let added = false;
      for (let bi = 0; bi < 5 && pick.length < 15; bi++) {
        const c = all.filter((x) => x.book === bi && ok(x) && !seen.has(letters(x.word)))[round * 3];
        if (c) {
          seen.add(letters(c.word));
          pick.push(c);
          added = true;
        }
      }
      if (!added) break;
    }
    if (pick.length >= 15) break;
  }
  out[t.id] = pick.slice(0, 15).map(({ word, ref }) => ({ word, ref }));
}
writeFileSync("src/data/taam-words.json", JSON.stringify(out, null, 1) + "\n");
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(22), v.length, v.slice(0, 3).map((x) => x.word).join("  "));
