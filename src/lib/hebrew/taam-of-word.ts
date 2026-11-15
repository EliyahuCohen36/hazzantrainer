import { PROSE_TEAMIM, type TaamReference } from "@/data/teamim-reference";

/**
 * Which ta'am a word of the Torah carries (21-book system), by the marks on it.
 * When a word has more than one mark, the strongest pausing ta'am wins, since
 * that's the one that shapes how the word is chanted.
 */

const BY_ID = new Map(PROSE_TEAMIM.map((t) => [t.id, t]));

const MARK_TO_ID: Record<string, string> = {
  "֑": "atnah",
  "֒": "segolta",
  "֔": "zakef-katon",
  "֕": "zakef-gadol",
  "֖": "tarha",
  "֗": "rebia",
  "֘": "zarka",
  "֮": "zarka",
  "֙": "kadma",
  "֚": "yetib",
  "֛": "tebir",
  "֡": "pazer-gadol",
  "֟": "karne-farah",
  "֠": "talsha",
  "֜": "gerish",
  "֝": "gerish",
  "֞": "shene-gerishin",
  "֥": "maarikh",
  "֤": "shofar-mehuppakh",
  "֧": "darga",
  "֨": "azla",
  "֩": "tilsa",
  "֦": "tere-taame",
  "֪": "yareah-ben-yomo",
};

/** Lower = stronger pause; conjunctives come last. */
function rank(t: TaamReference): number {
  return t.role === "mafsik" ? (t.level ?? 4) : 10;
}

/**
 * @param word the word as written (with te'amim)
 * @param pesikAfter whether a pesik (׀) follows the word
 */
export function taamOfWord(word: string, pesikAfter = false): TaamReference | undefined {
  if (word.endsWith("׃")) return BY_ID.get("sof-pasuk");
  const found: string[] = [];
  const marks = [...word];
  // Tere Kadmin: Kadma written twice on one word (or Azla + Kadma, in some texts).
  const kadmas = marks.filter((c) => c === "֙").length;
  const tereKadmin = kadmas >= 2 || (kadmas === 1 && marks.includes("֨"));
  for (const ch of marks) {
    if (ch === "֓") found.push("shalshelet");
    else if (ch === "֣") found.push(pesikAfter ? "shofar-holekh-pesik" : "shofar-holekh");
    else if (tereKadmin && (ch === "֙" || ch === "֨")) found.push("tere-kadmin");
    else if (MARK_TO_ID[ch]) found.push(MARK_TO_ID[ch]);
  }
  const candidates = found.map((id) => BY_ID.get(id)).filter((t): t is TaamReference => !!t);
  if (!candidates.length) return undefined;
  return candidates.sort((a, b) => rank(a) - rank(b))[0];
}
