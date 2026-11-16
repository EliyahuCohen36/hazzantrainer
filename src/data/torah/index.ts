/**
 * The full text of the Torah, one file per book.
 *
 * Source: Miqra According to the Masorah (MAM), by Seth (Avi) Kadish, from
 * Hebrew Wikisource, via MAM-simple (github.com/bdenckla/MAM-basics),
 * CC BY-SA 4.0. Where MAM notes that Sephardic Torah scrolls spell a word
 * differently, the Sephardic spelling is used here (10 places).
 * Ten Commandments: shown with the ta'am tahton (verse-by-verse cantillation).
 *
 * Each verse: { c: chapter, v: verse, t: tokens, br?: "p" | "s" }
 *   br: a petuha ("p") or setuma ("s") break after this verse
 * Tokens:
 *   "word"       a word (maqaf-joined words stay together); {X} = large letter, [X] = small letter
 *   { k, q }     ketiv (as written in the scroll) and qere (as read)
 *   "|"          pesik / legarmeh line after the previous word
 *   "_"          space in a song (Shirat HaYam, Haazinu)
 *   "׆"          inverted nun
 *   "¶p" / "¶s"  a petuha / setuma break inside a verse
 */
import bereshit from "./bereshit.json";
import shemot from "./shemot.json";
import vayikra from "./vayikra.json";
import bamidbar from "./bamidbar.json";
import devarim from "./devarim.json";

export type TorahToken = string | { k: string; q: string };

export interface TorahVerse {
  c: number;
  v: number;
  t: TorahToken[];
  br?: string;
  /** Nevi'im/Ketuvim books made of two or more parts (Shemuel Alef/Bet…): which part. */
  s?: number;
  /** 1 = this pasuk has Ta'amei Emet (Tehillim, Mishlei, Iyov 3:2–42:6). */
  e?: number;
}

export const TORAH_TEXT: Record<string, TorahVerse[]> = {
  bereshit: bereshit as TorahVerse[],
  shemot: shemot as TorahVerse[],
  vayikra: vayikra as TorahVerse[],
  bamidbar: bamidbar as TorahVerse[],
  devarim: devarim as TorahVerse[],
};

const pos = (cv: string) => {
  const [c, v] = cv.split(":").map(Number);
  return c * 1000 + v;
};

/** The verses of a book from "c:v" to "c:v", inclusive. */
export function versesBetween(book: string, from: string, to: string): TorahVerse[] {
  const a = pos(from);
  const b = pos(to);
  return (TORAH_TEXT[book] ?? []).filter((x) => x.c * 1000 + x.v >= a && x.c * 1000 + x.v <= b);
}
