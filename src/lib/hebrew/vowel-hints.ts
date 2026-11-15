/**
 * Reading hints for children, worked out per word:
 *  - ma'amid (meteg / silluq, U+05BD): which letter takes the sound
 *  - qamats katan (U+05C7, marked in our text): the short "o" qamats
 *  - sheva na: a sheva that is sounded ("e"); a sheva nach stays silent
 *
 * Sheva na rules used (standard grammar; MAM marks ga'ya with a meteg, so a
 * sounded sheva after a long vowel is caught by the meteg rule):
 *  1. sheva on the first letter of a word (also right after a וּ prefix)
 *  2. the second of two shevas in a row in the middle of a word
 *  3. sheva under a letter with a dagesh hazak (a doubled letter)
 *  4. sheva under the first of two identical letters (הַלְלוּ)
 *  5. sheva on a letter with a meteg, or right after a long vowel with a meteg
 *     (a ga'ya on a short vowel, as in וַֽיְהִי, is musical: the sheva stays nach)
 * A sheva on the last letter, or two shevas at the end of a word, is nach.
 */

export interface ClusterHint {
  /** The letter and its marks. */
  text: string;
  meteg: boolean;
  qamatsKatan: boolean;
  shevaNa: boolean;
}

const SHEVA = "ְ";
const QAMATS = "ָ";
const QAMATS_KATAN = "ׇ";
const METEG = "ֽ";
const DAGESH = "ּ";
const HOLAM = /[ֹֺ]/;
const isLetter = (c: string) => c >= "א" && c <= "ת";
const isMark = (c: string) => c >= "֑" && c <= "ׇ" && c !== "־" && c !== "׀" && c !== "׃" && c !== "׆";
const FINAL: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const base = (c: string) => FINAL[c] ?? c;

type Vowel = "sheva" | "hataf" | "long" | "short" | "hiriq" | "shuruk" | "none" | "mater";

function vowelOf(letter: string, marks: string): Vowel {
  if (marks.includes(SHEVA)) return "sheva";
  if (/[ֱ-ֳ]/.test(marks)) return "hataf";
  if (marks.includes(QAMATS_KATAN)) return "short";
  if (marks.includes(QAMATS) || marks.includes("ֵ") || HOLAM.test(marks)) return "long";
  if (marks.includes("ִ")) return "hiriq";
  if (/[ֶַֻ]/.test(marks)) return "short";
  if (letter === "ו" && marks.includes(DAGESH)) return "shuruk";
  return "none";
}

/** Split one word (no spaces, no maqaf) into letter clusters with hints. */
export function analyzeWord(word: string): { lead: string; clusters: ClusterHint[] } {
  const chars = [...word];
  let i = 0;
  let lead = "";
  while (i < chars.length && !isLetter(chars[i])) lead += chars[i++];
  const letters: string[] = [];
  const marks: string[] = [];
  const texts: string[] = [];
  while (i < chars.length) {
    let j = i + 1;
    while (j < chars.length && !isLetter(chars[j])) j++;
    const text = chars.slice(i, j).join("");
    letters.push(chars[i]);
    marks.push(chars.slice(i + 1, j).filter(isMark).join(""));
    texts.push(text);
    i = j;
  }
  const n = letters.length;
  const v: Vowel[] = letters.map((l, k) => vowelOf(l, marks[k]));

  // Vowel letters: holam male (וֹ), shuruk mid-word (וּ), hiriq male (ִי), and silent א ה ו י after a vowel.
  for (let k = 1; k < n; k++) {
    const l = letters[k];
    if (l === "ו" && v[k] === "long" && HOLAM.test(marks[k]) && !/[ְ-ָֻ]/.test(marks[k]) && v[k - 1] === "none") {
      v[k - 1] = "long";
      v[k] = "mater";
    } else if (v[k] === "shuruk" && v[k - 1] === "none") {
      v[k - 1] = "long";
      v[k] = "mater";
    } else if (v[k] === "none" && "אהוי".includes(l) && !marks[k].includes(DAGESH) && v[k - 1] !== "none" && v[k - 1] !== "sheva") {
      if (v[k - 1] === "hiriq" && l === "י") v[k - 1] = "long";
      v[k] = "mater";
    }
  }
  const full = (x: Vowel) => x === "long" || x === "short" || x === "hiriq" || x === "shuruk" || x === "mater";

  const hints: ClusterHint[] = texts.map((text, k) => ({
    text,
    meteg: marks[k].includes(METEG),
    qamatsKatan: marks[k].includes(QAMATS_KATAN),
    shevaNa: false,
  }));

  // The last letter that isn't a silent vowel letter.
  let last = n - 1;
  while (last > 0 && v[last] === "mater") last--;

  for (let k = 0; k < n; k++) {
    if (v[k] !== "sheva") continue;
    if (k === last || (k === last - 1 && v[last] === "sheva")) continue; // nach at the end of a word
    let na = false;
    if (k === 0) na = true;
    else if (k === 1 && v[0] === "shuruk") na = true;
    else if (marks[k].includes(METEG)) na = true;
    // A ga'ya on a long vowel before the sheva (שָֽׁמְרוּ) makes it na; on a short vowel
    // (וַֽיְהִי) the ga'ya is only musical and the sheva stays nach.
    else if (marks[k - 1].includes(METEG) && v[k - 1] === "long") na = true;
    else if (v[k - 1] === "sheva" && k - 1 > 0) na = true;
    else if (marks[k].includes(DAGESH) && full(v[k - 1]) && !(letters[k] === "ה" && k === last)) na = true;
    else if (k + 1 < n && base(letters[k + 1]) === base(letters[k])) na = true;
    hints[k].shevaNa = na;
  }
  return { lead, clusters: hints };
}
