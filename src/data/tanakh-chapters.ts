/**
 * Chapters of the Nevi'im and Ketuvim books (small: safe to use in the browser).
 * The text itself is in src/data/tanakh/ (server only).
 */
import chapters from "./tanakh/chapters.json";

/** Names of the parts of combined books, in order. */
export const PART_NAMES: Record<string, { slug: string; en: string; he: string }[]> = {
  shemuel: [
    { slug: "alef", en: "Shemuel Alef", he: "שמואל א" },
    { slug: "bet", en: "Shemuel Bet", he: "שמואל ב" },
  ],
  melakhim: [
    { slug: "alef", en: "Melakhim Alef", he: "מלכים א" },
    { slug: "bet", en: "Melakhim Bet", he: "מלכים ב" },
  ],
  "tere-asar": [
    { slug: "hoshea", en: "Hoshea", he: "הושע" },
    { slug: "yoel", en: "Yoel", he: "יואל" },
    { slug: "amos", en: "Amos", he: "עמוס" },
    { slug: "ovadya", en: "Ovadya", he: "עובדיה" },
    { slug: "yonah", en: "Yonah", he: "יונה" },
    { slug: "mikha", en: "Mikha", he: "מיכה" },
    { slug: "nahum", en: "Nahum", he: "נחום" },
    { slug: "havakuk", en: "Havakuk", he: "חבקוק" },
    { slug: "tsefanya", en: "Tsefanya", he: "צפניה" },
    { slug: "haggai", en: "Haggai", he: "חגי" },
    { slug: "zekharya", en: "Zekharya", he: "זכריה" },
    { slug: "malakhi", en: "Malakhi", he: "מלאכי" },
  ],
  "ezra-nehemia": [
    { slug: "ezra", en: "Ezra", he: "עזרא" },
    { slug: "nehemia", en: "Nehemia", he: "נחמיה" },
  ],
  "divre-hayamim": [
    { slug: "alef", en: "Divre HaYamim Alef", he: "דברי הימים א" },
    { slug: "bet", en: "Divre HaYamim Bet", he: "דברי הימים ב" },
  ],
};

/** The five megillot: the only books here with a Scroll Mode. */
export const MEGILLOT = new Set(["ester", "ruth", "shir-hashirim", "eikha", "kohelet"]);

export interface ChapterRef {
  /** URL part: "3", or "alef-3" / "yonah-2" in combined books. */
  slug: string;
  part: number;
  c: number;
  /** Number of pesukim. */
  verses: number;
}

export interface BookPart {
  en?: string;
  he?: string;
  chapters: ChapterRef[];
}

/** The parts (one for most books) and chapters of a Nevi'im/Ketuvim book. */
export function bookParts(book: string): BookPart[] {
  const parts = (chapters as Record<string, { osis: string; chapters: number[] }[]>)[book] ?? [];
  const names = PART_NAMES[book];
  return parts.map((p, i) => ({
    en: names?.[i].en,
    he: names?.[i].he,
    chapters: p.chapters.map((n, ci) => ({
      slug: names ? `${names[i].slug}-${ci + 1}` : String(ci + 1),
      part: i,
      c: ci + 1,
      verses: n,
    })),
  }));
}

export function allChapters(book: string): ChapterRef[] {
  return bookParts(book).flatMap((p) => p.chapters);
}

export function partName(book: string, part: number) {
  return PART_NAMES[book]?.[part];
}
