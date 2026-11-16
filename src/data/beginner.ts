/**
 * Beginner Keriah (kindergarten / first-time readers): the letters of the
 * alef-bet with the sofiyot, then every letter with every nekuda.
 * Names and sounds follow the Syrian (Sephardic) pronunciation: qamats is
 * "a" like patah, and tav without a dagesh is still "t".
 *
 * Recordings: the Hazzan's voice only. Until a recording exists for a tile,
 * the tile shows without a play button. Paths are in the private bucket
 * (see src/data/beginner-recordings.ts).
 */

export interface Letter {
  id: string;
  /** The letter as shown (with dagesh or shin/sin dot where that's part of it). */
  char: string;
  /** Name in English letters (Syrian pronunciation). */
  name: string;
  /** Name in Hebrew. */
  he: string;
  /** Its sound, for a child (or "silent"). */
  sound: string;
  /** Short spelling of the sound, to spell syllables ("b" + "a" = "ba"). */
  sym: string;
  /** Final form, if it has one. */
  sofit?: string;
}

/** The 22 letters, with the dagesh/dot pairs that sound different shown as their own tiles. */
export const LETTERS: Letter[] = [
  { id: "alef", char: "א", name: "Alef", he: "אָלֶף", sound: "no sound by itself", sym: "" },
  { id: "bet", char: "בּ", name: "Bet", he: "בֵּית", sound: "b", sym: "b" },
  { id: "vet", char: "ב", name: "Vet", he: "בֵית", sound: "v", sym: "v" },
  { id: "gimel", char: "ג", name: "Gimel", he: "גִּימֶל", sound: "g", sym: "g" },
  { id: "dalet", char: "ד", name: "Dalet", he: "דָּלֶת", sound: "d", sym: "d" },
  { id: "he", char: "ה", name: "He", he: "הֵא", sound: "no sound by itself", sym: "h" },
  { id: "vav", char: "ו", name: "Vav", he: "וָו", sound: "v", sym: "v" },
  { id: "zayin", char: "ז", name: "Zayin", he: "זַיִן", sound: "z", sym: "z" },
  { id: "het", char: "ח", name: "Het", he: "חֵית", sound: "ḥ (deep h)", sym: "ḥ" },
  { id: "tet", char: "ט", name: "Tet", he: "טֵית", sound: "t", sym: "t" },
  { id: "yod", char: "י", name: "Yod", he: "יוֹד", sound: "y", sym: "y" },
  { id: "kaf", char: "כּ", name: "Kaf", he: "כַּף", sound: "k", sym: "k" },
  { id: "khaf", char: "כ", name: "Khaf", he: "כַף", sound: "kh", sym: "kh", sofit: "ך" },
  { id: "lamed", char: "ל", name: "Lamed", he: "לָמֶד", sound: "l", sym: "l" },
  { id: "mem", char: "מ", name: "Mem", he: "מֵם", sound: "m", sym: "m", sofit: "ם" },
  { id: "nun", char: "נ", name: "Nun", he: "נוּן", sound: "n", sym: "n", sofit: "ן" },
  { id: "samekh", char: "ס", name: "Samekh", he: "סָמֶךְ", sound: "s", sym: "s" },
  { id: "ayin", char: "ע", name: "Ayin", he: "עַיִן", sound: "deep, from the throat", sym: "ʿ" },
  { id: "pe", char: "פּ", name: "Pe", he: "פֵּא", sound: "p", sym: "p" },
  { id: "fe", char: "פ", name: "Fe", he: "פֵא", sound: "f", sym: "f", sofit: "ף" },
  { id: "tsadi", char: "צ", name: "Tsadi", he: "צָדִי", sound: "ts", sym: "ts", sofit: "ץ" },
  { id: "qof", char: "ק", name: "Qof", he: "קוֹף", sound: "q (deep k)", sym: "q" },
  { id: "resh", char: "ר", name: "Resh", he: "רֵישׁ", sound: "r", sym: "r" },
  { id: "shin", char: "שׁ", name: "Shin", he: "שִׁין", sound: "sh", sym: "sh" },
  { id: "sin", char: "שׂ", name: "Sin", he: "שִׂין", sound: "s", sym: "s" },
  { id: "tav", char: "ת", name: "Tav", he: "תָּו", sound: "t", sym: "t" },
];

/** The five final letters (they only come at the end of a word). */
export const SOFIYOT: { id: string; char: string; name: string; he: string; of: string }[] = [
  { id: "khaf-sofit", char: "ך", name: "Khaf Sofit", he: "כַף סוֹפִית", of: "khaf" },
  { id: "mem-sofit", char: "ם", name: "Mem Sofit", he: "מֵם סוֹפִית", of: "mem" },
  { id: "nun-sofit", char: "ן", name: "Nun Sofit", he: "נוּן סוֹפִית", of: "nun" },
  { id: "fe-sofit", char: "ף", name: "Fe Sofit", he: "פֵא סוֹפִית", of: "fe" },
  { id: "tsadi-sofit", char: "ץ", name: "Tsadi Sofit", he: "צָדִי סוֹפִית", of: "tsadi" },
];

export interface Nekuda {
  id: string;
  name: string;
  he: string;
  /** The sound, for a child. */
  sound: string;
  /** Short vowel for spelling syllables. */
  v: string;
  /** How it's written on a letter: the mark(s), and a vowel letter that follows, if any. */
  mark: string;
  after?: string;
  /** A colour for the tiles. */
  color: string;
}

/** The nekudot in the order children learn them: the "a" sounds first. */
export const NEKUDOT: Nekuda[] = [
  { id: "qamats", name: "Qamats", he: "קָמַץ", sound: "a", v: "a", mark: "ָ", color: "amber" },
  { id: "patah", name: "Patah", he: "פַּתַח", sound: "a", v: "a", mark: "ַ", color: "amber" },
  { id: "sere", name: "Sere", he: "צֵרֵי", sound: "e", v: "e", mark: "ֵ", color: "sky" },
  { id: "segol", name: "Segol", he: "סֶגּוֹל", sound: "e", v: "e", mark: "ֶ", color: "sky" },
  { id: "hireq", name: "Hireq", he: "חִירֶק", sound: "i", v: "i", mark: "ִ", color: "emerald" },
  { id: "hireq-male", name: "Hireq with Yod", he: "חִירֶק מָלֵא", sound: "i", v: "i", mark: "ִ", after: "י", color: "emerald" },
  { id: "holem", name: "Holem", he: "חוֹלֶם", sound: "o", v: "o", mark: "ֹ", color: "rose" },
  { id: "holem-male", name: "Holem with Vav", he: "חוֹלֶם מָלֵא", sound: "o", v: "o", mark: "", after: "וֹ", color: "rose" },
  { id: "qibbus", name: "Qibbus", he: "קִבּוּץ", sound: "u", v: "u", mark: "ֻ", color: "violet" },
  { id: "shuruq", name: "Shuruq", he: "שׁוּרֶק", sound: "u", v: "u", mark: "", after: "וּ", color: "violet" },
  // Sheva is not here: it has its own section (/beginner/sheva/), opened after all the other nekudot.
  { id: "hataf-patah", name: "Hataf Patah", he: "חֲטַף פַּתַח", sound: "a (short)", v: "a", mark: "ֲ", color: "amber" },
  { id: "hataf-segol", name: "Hataf Segol", he: "חֲטַף סֶגּוֹל", sound: "e (short)", v: "e", mark: "ֱ", color: "sky" },
  { id: "hataf-qamats", name: "Hataf Qamats", he: "חֲטַף קָמַץ", sound: "o (short)", v: "o", mark: "ֳ", color: "rose" },
];

/** The Sheva, taught in its own section after everything else (see SHEVA_LEVEL). */
export const SHEVA: Nekuda = { id: "sheva", name: "Sheva", he: "שְׁוָא", sound: "e (short) or silent", v: "'", mark: "ְ", color: "stone" };

/** Khaf Sofit with a sheva (ךְ), shown in the Sheva section. */
export const KHAF_SOFIT_SHEVA = { sofit: "khaf-sofit", text: "ךְ", sound: "kh" };

const DAGESH = "ּ";
const SHIN_DOT = /[ׁׂ]/;

/**
 * The letter with the nekuda, or null when that combination isn't used.
 * Marks go in the standard order: letter, dagesh, shin/sin dot, vowel.
 */
export function withNekuda(letter: Letter, n: Nekuda): string | null {
  const throat = ["alef", "he", "het", "ayin"].includes(letter.id);
  // Hataf vowels go (almost only) under the throat letters, and those letters take a
  // hataf instead of a sheva.
  if (n.id.startsWith("hataf") && !throat) return null;
  if (n.id === "sheva" && throat) return null;
  const base = letter.char;
  return base + n.mark + (n.after ?? "");
}

/**
 * Final letters with a nekuda: in the Torah only Khaf Sofit takes one, with a
 * sheva (ךְ, silent; left out until the sheva section) or a qamats (ךָ, "kha"). The other sofiyot never have a nekuda.
 */
export const SOFIT_WITH_NEKUDA: { sofit: string; nekuda: string; text: string; sound: string }[] = [
  { sofit: "khaf-sofit", nekuda: "qamats", text: "ךָ", sound: "kha" },
];

/** Steps of the beginner course, shown on /beginner/. */
export const BEGINNER_STEPS = [
  { href: "/beginner/letters/", title: "The Alef-Bet", he: "אָלֶף בֵּית", text: "Every letter, its name and its sound.", emoji: "🔤" },
  { href: "/beginner/letters/#sofiyot", title: "Final letters", he: "סוֹפִיּוֹת", text: "The five letters that look different at the end of a word.", emoji: "🔚" },
  { href: "/beginner/nekudot/", title: "The Nekudot", he: "נְקוּדוֹת", text: "The dots and lines that make the sounds a, e, i, o, u.", emoji: "•" },
  { href: "/beginner/chart/", title: "Letters with Nekudot", he: "לוּחַ", text: "Every letter with every nekuda, to read one by one.", emoji: "📋" },
  { href: "/beginner/words/", title: "Practice words", he: "מִלִּים", text: "Read real Torah words with the nekudot you know, and get stars.", emoji: "⭐" },
  { href: "/beginner/sheva/", title: "The Sheva", he: "שְׁוָא", text: "Sheva Na and Sheva Nach, once all the letters and nekudot are learned.", emoji: "⁚" },
];

/** How a letter with a nekuda sounds, spelled simply: "ba", "kho", "a". */
export function spell(letter: Letter, n: Nekuda): string {
  return letter.sym + n.v;
}

export const NEKUDA_BY_ID = new Map(NEKUDOT.map((n) => [n.id, n]));
export const LETTER_BY_ID = new Map(LETTERS.map((l) => [l.id, l]));
export { DAGESH, SHIN_DOT };

/**
 * Beginner Keriah levels. A child sees only the levels their teacher opened
 * (classes.beginner_level, or a per-child override; see supabase/beginner.sql).
 * Teachers, admins and families see everything.
 */
export interface BeginnerLevel {
  n: number;
  title: string;
  he: string;
  letters?: string[];
  sofiyot?: boolean;
  nekudot?: string[];
  /** The full chart (everything together). */
  chart?: boolean;
  href: string;
}

export const BEGINNER_LEVELS: BeginnerLevel[] = [
  { n: 1, title: "Letters Alef to Tet", he: "א – ט", letters: ["alef", "bet", "vet", "gimel", "dalet", "he", "vav", "zayin", "het", "tet"], href: "/beginner/letters/" },
  { n: 2, title: "Letters Yod to Samekh", he: "י – ס", letters: ["yod", "kaf", "khaf", "lamed", "mem", "nun", "samekh"], href: "/beginner/letters/" },
  { n: 3, title: "Letters Ayin to Tav", he: "ע – ת", letters: ["ayin", "pe", "fe", "tsadi", "qof", "resh", "shin", "sin", "tav"], href: "/beginner/letters/" },
  { n: 4, title: "Final letters", he: "סוֹפִיּוֹת", sofiyot: true, href: "/beginner/letters/#sofiyot" },
  { n: 5, title: "Qamats and Patah: \"a\"", he: "קָמַץ פַּתַח", nekudot: ["qamats", "patah"], href: "/beginner/nekudot/qamats/" },
  { n: 6, title: "Sere and Segol: \"e\"", he: "צֵרֵי סֶגּוֹל", nekudot: ["sere", "segol"], href: "/beginner/nekudot/sere/" },
  { n: 7, title: "Hireq: \"i\"", he: "חִירֶק", nekudot: ["hireq", "hireq-male"], href: "/beginner/nekudot/hireq/" },
  { n: 8, title: "Holem: \"o\"", he: "חוֹלֶם", nekudot: ["holem", "holem-male"], href: "/beginner/nekudot/holem/" },
  { n: 9, title: "Qibbus and Shuruq: \"u\"", he: "קִבּוּץ שׁוּרֶק", nekudot: ["qibbus", "shuruq"], href: "/beginner/nekudot/qibbus/" },
  { n: 10, title: "Short sounds (hataf)", he: "חֲטָפִים", nekudot: ["hataf-patah", "hataf-segol", "hataf-qamats"], href: "/beginner/nekudot/hataf-patah/" },
  { n: 11, title: "Everything together", he: "לוּחַ", chart: true, href: "/beginner/chart/" },
  { n: 12, title: "The Sheva: Na and Nach", he: "שְׁוָא", href: "/beginner/sheva/" },
];

/** The Sheva section opens last, after all the letters and the other nekudot. */
export const SHEVA_LEVEL = 12;

export const BEGINNER_MAX = BEGINNER_LEVELS.length;
/** The level of the full chart (letters with all the nekudot except sheva). */
export const CHART_LEVEL = 11;

/** What's open for someone who has reached `level`. */
export function openBeginner(level: number) {
  const open = BEGINNER_LEVELS.filter((l) => l.n <= level);
  return {
    letters: new Set(open.flatMap((l) => l.letters ?? [])),
    sofiyot: open.some((l) => l.sofiyot),
    nekudot: new Set(open.flatMap((l) => l.nekudot ?? [])),
    chart: open.some((l) => l.chart),
  };
}

/** The level a nekuda is taught in. */
export function nekudaLevel(id: string): number {
  return BEGINNER_LEVELS.find((l) => l.nekudot?.includes(id))?.n ?? BEGINNER_MAX;
}

/** The level a letter is taught in. */
export function letterLevel(id: string): number {
  return BEGINNER_LEVELS.find((l) => l.letters?.includes(id))?.n ?? 1;
}

/**
 * Letters the child may use: the teacher opens them one at a time in alef-bet order
 * (letters_open). Once the final letters (level 4) are open, all letters are.
 */
export function openLetters(lettersOpen: number, beginnerLevel: number): Letter[] {
  return beginnerLevel >= 4 ? LETTERS : LETTERS.slice(0, Math.max(1, lettersOpen));
}

/** Letters that make the same sound (e.g. Samekh and Sin, Tet and Tav, Vet and Vav). */
export function sameSound(letter: Letter, among: Letter[]): Letter[] {
  return letter.sym ? among.filter((l) => l.sym === letter.sym && l.id !== "alef" && l.id !== "he") : [letter];
}
