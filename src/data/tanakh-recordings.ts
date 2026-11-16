/**
 * Where the Hazzan's Tanakh recordings go in the private "recordings" bucket.
 * The admin uploads them at /admin/ → Tanakh recordings; pages find them by
 * listing the folder, so nothing has to be added to the code.
 *
 *   reading/<book>/<parasha>/aliyah-<1..7>.mp3, maftir.mp3   (Torah, one file per aliyah)
 *   reading/<book>/<chapter>.mp3                            (Nevi'im / Ketuvim, one per chapter)
 *   teamim/<tune>/<taamId>.mp3                              (te'amim of each tune)
 *
 * Site paths start with /audio/ (see src/lib/recordings.ts).
 */
import { TANAKH, type TanakhBook } from "./teamim-reference";

export const aliyahRecording = (book: string, parasha: string, n: number | "M") =>
  `/audio/reading/${book}/${parasha}/${n === "M" ? "maftir" : `aliyah-${n}`}.mp3`;

export const chapterRecording = (book: string, chapterSlug: string) => `/audio/reading/${book}/${chapterSlug}.mp3`;

export interface TuneSet {
  id: string;
  en: string;
  he: string;
  /** Which te'amim this tune uses. */
  system: "prose" | "emet";
  /** Books sung to this tune. */
  books: string[];
}

/**
 * The tunes, each with its own set of te'amim recordings. The Torah tune's
 * recordings are the ones already in the te'amim trainer (teamim/torah/).
 * Kohelet, Daniel, Ezra-Nehemia and Divre HaYamim are read with the Ruth tune.
 */
export const TUNE_SETS: TuneSet[] = [
  { id: "torah", en: "Torah", he: "תורה", system: "prose", books: TANAKH.filter((b) => b.section === "torah").map((b) => b.id) },
  { id: "neviim", en: "Nevi'im (Haftarah)", he: "נביאים", system: "prose", books: TANAKH.filter((b) => b.section === "neviim").map((b) => b.id) },
  { id: "tehillim", en: "Tehillim", he: "תהלים", system: "emet", books: ["tehillim"] },
  { id: "mishle", en: "Mishle", he: "משלי", system: "emet", books: ["mishle"] },
  { id: "iyov", en: "Iyov", he: "איוב", system: "emet", books: ["iyov"] },
  { id: "shir-hashirim", en: "Shir HaShirim", he: "שיר השירים", system: "prose", books: ["shir-hashirim"] },
  { id: "ruth", en: "Ruth (also Kohelet, Daniel, Ezra-Nehemia, Divre HaYamim)", he: "רות", system: "prose", books: ["ruth", "kohelet", "daniel", "ezra-nehemia", "divre-hayamim"] },
  { id: "eikha", en: "Eikha", he: "איכה", system: "prose", books: ["eikha"] },
  { id: "ester", en: "Ester", he: "אסתר", system: "prose", books: ["ester"] },
];

export const tuneOf = (book: TanakhBook | string) => {
  const id = typeof book === "string" ? book : book.id;
  return TUNE_SETS.find((t) => t.books.includes(id));
};

export const tuneRecording = (tune: string, taamId: string) => `/audio/teamim/${tune}/${taamId}.mp3`;
