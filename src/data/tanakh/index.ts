/**
 * The text of Nevi'im and Ketuvim, one file per book (format as in
 * src/data/torah/index.ts; `s` = part of a combined book).
 *
 * Source: Miqra According to the Masorah (MAM), Hebrew Wikisource, via
 * MAM-simple (github.com/bdenckla/MAM-basics), CC BY-SA 4.0. Built by
 * scripts/tanakh-text/build.py. Tehillim, Mishlei and Iyov keep their own
 * te'amim (Ta'amei Emet), as in the Aleppo Codex tradition MAM follows.
 */
import type { TorahVerse } from "@/data/torah";
import { allChapters, bookParts, MEGILLOT, partName, type ChapterRef, type BookPart } from "@/data/tanakh-chapters";
import yehoshua from "./yehoshua.json";
import shofetim from "./shofetim.json";
import shemuel from "./shemuel.json";
import melakhim from "./melakhim.json";
import yeshayahu from "./yeshayahu.json";
import yirmeyahu from "./yirmeyahu.json";
import yehezkel from "./yehezkel.json";
import tereAsar from "./tere-asar.json";
import tehillim from "./tehillim.json";
import mishle from "./mishle.json";
import iyov from "./iyov.json";
import shirHashirim from "./shir-hashirim.json";
import ruth from "./ruth.json";
import eikha from "./eikha.json";
import kohelet from "./kohelet.json";
import ester from "./ester.json";
import daniel from "./daniel.json";
import ezraNehemia from "./ezra-nehemia.json";
import divreHayamim from "./divre-hayamim.json";

const TEXT: Record<string, TorahVerse[]> = {
  yehoshua, shofetim, shemuel, melakhim, yeshayahu, yirmeyahu, yehezkel, "tere-asar": tereAsar,
  tehillim, mishle, iyov, "shir-hashirim": shirHashirim, ruth, eikha, kohelet, ester, daniel,
  "ezra-nehemia": ezraNehemia, "divre-hayamim": divreHayamim,
} as Record<string, TorahVerse[]>;

/** Does this pasuk have Ta'amei Emet? */
function isEmet(book: string, c: number, v: number) {
  if (book === "tehillim" || book === "mishle") return true;
  if (book !== "iyov") return false;
  const n = c * 1000 + v;
  return n >= 3002 && n <= 42006;
}

/** The pesukim of one chapter (Emet pesukim are marked e: 1). */
export function chapterVerses(book: string, ref: ChapterRef): TorahVerse[] {
  return (TEXT[book] ?? [])
    .filter((x) => (x.s ?? 0) === ref.part && x.c === ref.c)
    .map((x) => (isEmet(book, x.c, x.v) ? { ...x, e: 1 } : x));
}


export { allChapters, bookParts, MEGILLOT, partName, type ChapterRef, type BookPart };
