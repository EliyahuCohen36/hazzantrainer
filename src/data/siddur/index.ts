/**
 * The Siddur, nusach Edot HaMizrah (Torat Emet 357, via Sefaria), built by
 * scripts/siddur/build.py. index.json (parts and their sections) is small;
 * each part's text is its own file, loaded by that part's page only.
 *
 * Recordings (uploaded by the admin right on the page, or at /admin/):
 *   siddur/<part>/<section>-<paragraph>.mp3          (1-based numbers)
 *   siddur/<part>/<section>-<paragraph>@<maqam>-<n>.mp3  (tune n in a maqam; Shabbat/Yom Tov parts)
 *   … and the same name with .json: the time each word starts (for highlighting).
 */
import index from "./index.json";

export interface SiddurPartInfo {
  slug: string;
  he: string;
  en: string;
  sections: { he: string; n: number }[];
}
export interface SiddurPart extends Omit<SiddurPartInfo, "sections"> {
  sections: { he: string; paras: string[] }[];
}

export const SIDDUR_PARTS = index as SiddurPartInfo[];

/** A paragraph's recording; with a maqam, tune number `tune` (1, 2, …) in that maqam. */
export const siddurRecording = (part: string, s: number, p: number, maqam?: string, tune = 1) =>
  `/audio/siddur/${part}/${s + 1}-${p + 1}${maqam ? `@${maqam}-${tune}` : ""}.mp3`;

/** How many tunes in one maqam a place can have. */
export const MAX_TUNES = 6;

/** The maqam tunes are learned in the Shabbat and Yom Tov parts only (owner). */
export const TUNE_PARTS = new Set(["arvit-shabbat", "leil-shabbat", "shaharit-shabbat", "musaf-shabbat", "minha-shabbat", "regalim"]);
export const tunesHere = (part: string) => TUNE_PARTS.has(part);

/** The maqamot the Hazzan can record a tune in. */
export const MAQAMOT: { id: string; en: string; he: string }[] = [
  { id: "rast", en: "Rast", he: "ראסט" },
  { id: "mahour", en: "Mahour", he: "מאהור" },
  { id: "ajam", en: "Ajam", he: "עג׳ם" },
  { id: "nahwand", en: "Nahwand", he: "נהאוונד" },
  { id: "bayat", en: "Bayat", he: "ביאת" },
  { id: "hoseni", en: "Hoseni", he: "חוסייני" },
  { id: "saba", en: "Saba", he: "צבא" },
  { id: "hijaz", en: "Hijaz", he: "חג׳אז" },
  { id: "sigah", en: "Sigah", he: "סיגא" },
  { id: "huzam", en: "Huzam", he: "הוזאם" },
  { id: "kurd", en: "Kurd", he: "כורד" },
];

/**
 * Places sung to a tune (owner's list): a paragraph that has one of these
 * gets a choice of maqam. Matched on the letters only (no nikkud).
 */
export const TUNE_SPOTS: { label: string; find: string; part?: string }[] = [
  { label: "ה׳ מלך", find: "יהוה מלך יהוה מלך" },
  { label: "הללויה הללו אל בקדשו", find: "הללו אל בקדשו" },
  { label: "נשמת כל חי", find: "נשמת כל חי" },
  { label: "שועת עניים", find: "שועת עניים" },
  { label: "אל ההודאות", find: "אל ההודאות" },
  { label: "קדיש (לפני יוצר אור בשבת)", find: "יתגדל ויתקדש", part: "shaharit-shabbat" },
  { label: "שמחים בצאתם", find: "שמחים בצאתם" },
  { label: "ממצרים גאלתנו", find: "ממצרים גאלתנו" },
  { label: "נקדישך", find: "נקדישך" },
  { label: "כתר יתנו לך", find: "כתר יתנו לך" },
  { label: "ואני תפילתי לך ה׳ עת רצון", find: "ואני תפלתי לך" },
];

const letters = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/[֑-ׇ]/g, "")
    .replace(/יהוה|ה'/g, "יהוה");

/** The tune spot in a paragraph, if any. */
export function tuneSpot(part: string, html: string, sectionHe: string) {
  const t = letters(html).replace(/\s+/g, " ");
  return TUNE_SPOTS.find((x) => {
    if (x.part && x.part !== part) return false;
    // The Kaddish before Yotser: the Kaddish at the end of Pesukei deZimra on Shabbat.
    if (x.part && !/פסוקי דזמרה|ישתבח|ק"ש/.test(sectionHe)) return false;
    return t.includes(x.find) || t.includes(x.find.replace("תפילתי", "תפלתי"));
  });
}
