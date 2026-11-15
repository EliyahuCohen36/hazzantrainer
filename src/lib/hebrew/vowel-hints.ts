/**
 * Reading hints for children, worked out per word:
 *  - ma'amid (meteg / silluq, U+05BD): which letter takes the sound
 *  - qamats katan (U+05C7, marked in our text): the short "o" qamats
 *  - sheva na: a sheva that is sounded ("e"); a sheva nach stays silent
 *
 * Sheva na rules (as given by the site owner, Syrian tradition):
 *  - sheva on the first letter of a word: na
 *  - sheva on a letter with a dagesh, when it isn't the last letter: na
 *  - after qamats, tsere, hiriq male, holam (haser or male), or a shuruk in the
 *    middle of a word: na
 *  - after patah, segol, hiriq haser, qamats katan, qubuts, or a shuruk that is
 *    the first letter of the word (וּ): nach
 *  - the second of two shevas in the middle of a word: na
 *  - on the last letter, or two shevas at the end of a word: nach
 *  - right after the stressed vowel (mil'el words like לָ֑יְלָה, קֵ֣דְמָה, הַשָּׁמַ֗יְמָה): nach
 *  - never in Hashem's name
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
/** Accents that sit on the stressed letter. Positional accents (always written on
 *  the last or first letter) count only when they're written elsewhere, as MAM
 *  repeats them on the stressed letter. */
const POSTPOSITIVE = /[\u0592\u0599\u05A9\u05AE]/;
const PREPOSITIVE = /[\u05A0\u059A]/;
const ACCENT = /[\u0591-\u05AF]/g;
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

  // Hashem's name (also with a prefix): no bold sheva.
  const consonants = letters.join("");
  if (consonants.endsWith("יהוה")) return { lead, clusters: hints };

  // Which letter has the stress (from the te'amim). In the last word of a pasuk,
  // the silluq (written like a meteg) marks it.
  let stress = -1;
  if (word.includes("\u05C3")) {
    for (let k = n - 1; k >= 0; k--) if (marks[k].includes(METEG)) { stress = k; break; }
  }
  if (stress < 0) {
    for (let k = 0; k < n; k++) {
      const acc = (marks[k].match(ACCENT) ?? []).filter(
        (c) => !(POSTPOSITIVE.test(c) && k === n - 1) && !(PREPOSITIVE.test(c) && k === 0),
      );
      if (acc.length) stress = k;
    }
  }

  // The last letter that isn't a silent vowel letter.
  let last = n - 1;
  while (last > 0 && v[last] === "mater") last--;

  for (let k = 0; k < n; k++) {
    if (v[k] !== "sheva") continue;
    if (k === last || (k === last - 1 && v[last] === "sheva")) continue; // nach at the end of a word
    let na: boolean;
    if (k === 0) na = true; // first letter of the word
    else if (marks[k].includes(DAGESH)) na = true; // a letter with a dagesh (not the last letter)
    else if (v[k - 1] === "sheva") na = k - 1 > 0; // the second of two shevas
    else {
      // The vowel before it. A silent vowel letter (וֹ, וּ, ִי, …) belongs to the letter before it.
      const prev = v[k - 1] === "mater" && k >= 2 ? v[k - 2] : v[k - 1];
      const prevAt = v[k - 1] === "mater" && k >= 2 ? k - 2 : k - 1;
      if (prev === "shuruk") na = false; // וּ as the first letter of the word: nach
      else if (prevAt === stress) na = false; // stressed syllable closed by the sheva (לָ֑יְלָה, קֵ֣דְמָה): nach
      else na = prev === "long"; // qamats, tsere, hiriq male, holam, shuruk mid-word: na
      // patah, segol, hiriq haser, qamats katan, qubuts: nach
    }
    hints[k].shevaNa = na;
  }
  return { lead, clusters: hints };
}
