import { EMET_TEAMIM, PROSE_TEAMIM, type TaamReference } from "@/data/teamim-reference";

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

/* ── Ta'amei Emet (Tehillim, Mishlei, Iyov 3:2–42:6) ─────────────────────── */

const EMET_BY_ID = new Map(EMET_TEAMIM.map((t) => [t.id, t]));

/** The Emet ta'am of one word, before Rebia Katon is told apart (needs the next word). */
function emetId(word: string, pesikAfter: boolean): string | undefined {
  if (word.endsWith("׃")) return "emet-sof-pasuk";
  const has = (c: string) => word.includes(c);
  if (has("֫")) return "emet-oleh-ve-yored"; // ole (with yored = merkha below)
  if (has("֑")) return "emet-atnah";
  if (has("֗")) return has("֝") ? "emet-rebia-megurash" : "emet-rebia-gadol";
  if (has("֮")) return "emet-tsinnor";
  if (has("֭")) return "emet-dehi";
  if (has("֡")) return "emet-pazer-gadol";
  if (has("֓")) return pesikAfter ? "emet-shalshelet-gedola" : "emet-shalshelet-ketana";
  if (has("֨")) return pesikAfter ? "emet-kadma-legarmeh" : "emet-azla";
  if (has("֤")) return pesikAfter ? "emet-mehuppakh-legarmeh" : "emet-mehuppakh";
  if (has("֬")) return "emet-illuy";
  if (has("֘")) return "emet-tsinnorit";
  if (has("֪") || has("֢")) return "emet-galgal";
  if (has("֖")) return "emet-tarha";
  if (has("֥") || has("֦")) return "emet-ma-arikh";
  if (has("֣")) return "emet-shofar-holekh";
  return undefined;
}

/**
 * The Emet ta'am of every word of a pasuk. A Rebia is "Katon" when the next
 * pause after it is the Oleh ve-Yored.
 * @param words the words as written; @param pesikAfter whether a pesik follows each word
 */
export function emetTeamim(words: string[], pesikAfter: boolean[]): (TaamReference | undefined)[] {
  const ids = words.map((w, i) => emetId(w, pesikAfter[i]));
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== "emet-rebia-gadol") continue;
    for (let j = i + 1; j < ids.length; j++) {
      const t = ids[j] ? EMET_BY_ID.get(ids[j]!) : undefined;
      if (t?.role !== "mafsik") continue;
      if (ids[j] === "emet-oleh-ve-yored") ids[i] = "emet-rebia-katon";
      break;
    }
  }
  return ids.map((id) => (id ? EMET_BY_ID.get(id) : undefined));
}
