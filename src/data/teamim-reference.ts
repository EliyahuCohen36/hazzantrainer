/**
 * Names of the te'amim, for the reference page (/teamim).
 *
 * Names follow the Syrian (Aleppo) tradition as given by the Sephardic
 * Pizmonim Project (pizmonim.org/taamim.php). Check them with your Hazzan;
 * this file is the one place to change the names shown on the page.
 *
 * Note the Sephardic names that differ from the Ashkenazi ones:
 *   Ashkenazi "Pashta" = Syrian "Kadma";  Ashkenazi "Kadma" = Syrian "Azla";
 *   Telisha Gedola = "Talsha" (תלשׁא);  Telisha Ketana = "Tilsa" (תילשׂא).
 *   These two are different te'amim with different sounds.
 *
 * `sample` is the mark drawn on the letter א (sometimes two letters, for
 * te'amim made of two marks).
 */

export type TeamimSystem = "prose" | "emet";

export interface TaamReference {
  /** Stable id (used for recordings and examples). Set on the Torah list. */
  id?: string;
  /** Syrian name. */
  syrian: string;
  /** Hebrew name (unpointed). */
  hebrew: string;
  /** Common Ashkenazi / textbook name, for comparison. */
  ashkenazi: string;
  sample: string;
  role: "mafsik" | "mesharet";
  /** Rank of a mafsik: 1 = strongest pause. */
  level?: 1 | 2 | 3 | 4;
  /** Short note on when it's used. */
  note?: string;
  /** An important rule to point out to students (shown highlighted). */
  tip?: string;
  /** Id of a related ta'am to link to from this card. */
  seeAlso?: string;
}

const A = "א";

/** The 21 prose books (all of Tanakh except Tehillim, Mishlei and Iyov). */
export const PROSE_TEAMIM: TaamReference[] = [
  // Level 1
  { id: "sof-pasuk", syrian: "Sof Pasuk", hebrew: "סוף פסוק", ashkenazi: "Sof Pasuk / Silluk", sample: `${A}ֽ׃`, role: "mafsik", level: 1, note: "Ends the pasuk." },
  { id: "atnah", syrian: "Atnah", hebrew: "אתנח", ashkenazi: "Etnachta", sample: `${A}֑`, role: "mafsik", level: 1, note: "Divides the pasuk in half." },
  // Level 2
  { id: "segolta", syrian: "Segolta", hebrew: "סגולתא", ashkenazi: "Segol", sample: `${A}֒`, role: "mafsik", level: 2, note: "Divides a long first half." },
  { id: "shalshelet", syrian: "Shalshelet", hebrew: "שלשלת", ashkenazi: "Shalshelet", sample: `${A}֓ ׀`, role: "mafsik", level: 2, note: "Takes the place of Segolta when it stands alone." },
  { id: "zakef-katon", syrian: "Zakef Katon", hebrew: "זקף קטן", ashkenazi: "Zakef Katon", sample: `${A}֔`, role: "mafsik", level: 2 },
  { id: "zakef-gadol", syrian: "Zakef Gadol", hebrew: "זקף גדול", ashkenazi: "Zakef Gadol", sample: `${A}֕`, role: "mafsik", level: 2, note: "Takes the place of Zakef Katon when it stands alone." },
  { id: "tarha", syrian: "Tarha", hebrew: "טרחא", ashkenazi: "Tipcha", sample: `${A}֖`, role: "mafsik", level: 2, note: "Comes before Sof Pasuk or Atnah." },
  // Level 3
  { id: "rebia", syrian: "Rebia", hebrew: "רביע", ashkenazi: "Revia", sample: `${A}֗`, role: "mafsik", level: 3 },
  { id: "zarka", syrian: "Zarka", hebrew: "זרקא", ashkenazi: "Zarka", sample: `${A}֮`, role: "mafsik", level: 3, note: "Comes before Segolta." },
  { id: "kadma", syrian: "Kadma", hebrew: "קדמא", ashkenazi: "Pashta", sample: `${A}֙`, role: "mafsik", level: 3, note: "Comes before Zakef Katon. Written at the end of the word." },
  { id: "tere-kadmin", syrian: "Tere Kadmin", hebrew: "תרי קדמין", ashkenazi: "Double Pashta", sample: `${A}֙${A}֙`, role: "mafsik", level: 3, note: "Kadma on a word not stressed on the last syllable." },
  { id: "yetib", syrian: "Yetib", hebrew: "יתיב", ashkenazi: "Yetiv", sample: `${A}֚`, role: "mafsik", level: 3, note: "Takes the place of Kadma when it stands alone. Looks like Shofar Mehuppakh, but is written before the first letter of the word." },
  { id: "tebir", syrian: "Tebir", hebrew: "תביר", ashkenazi: "Tevir", sample: `${A}֛`, role: "mafsik", level: 3, note: "Comes before Tarha." },
  // Level 4
  { id: "pazer-gadol", syrian: "Pazer Gadol", hebrew: "פזר גדול", ashkenazi: "Pazer", sample: `${A}֡`, role: "mafsik", level: 4 },
  { id: "karne-farah", syrian: "Karne Farah", hebrew: "קרני פרה", ashkenazi: "Pazer Gadol / Karnei Parah", sample: `${A}֟`, role: "mafsik", level: 4, note: "Rare: once in the Torah (Bamidbar 35:5)." },
  { id: "talsha", syrian: "Talsha", hebrew: "תלשׁא", ashkenazi: "Telisha Gedola", sample: `${A}֠`, role: "mafsik", level: 4, note: "Written at the start of the word. Not the same as Tilsa: it has its own sound." },
  { id: "gerish", syrian: "Gerish", hebrew: "גריש", ashkenazi: "Geresh", sample: `${A}֜`, role: "mafsik", level: 4 },
  { id: "shene-gerishin", syrian: "Shene Gerishin", hebrew: "שני גרישין", ashkenazi: "Gershayim", sample: `${A}֞`, role: "mafsik", level: 4 },
  { id: "shofar-holekh-pesik", syrian: "Shofar Holekh with Pesik", hebrew: "שופר הולך ופסיק", ashkenazi: "Munach Legarmeh", sample: `${A}֣ ׀`, role: "mafsik", level: 4, note: "Comes before Rebia.", tip: "When a pesik (׀) comes right after a word with Shofar Holekh, that word is sung with the Pesik sound, not the usual Shofar Holekh. The Pesik sound goes on the letter that has the Shofar Holekh under it.", seeAlso: "shofar-holekh" },
  // Conjunctives
  { id: "maarikh", syrian: "Ma'arikh", hebrew: "מאריך", ashkenazi: "Mercha", sample: `${A}֥`, role: "mesharet", note: "Leads into Sof Pasuk, Tarha and others." },
  { id: "shofar-holekh", syrian: "Shofar Holekh", hebrew: "שופר הולך", ashkenazi: "Munach", sample: `${A}֣`, role: "mesharet", note: "Leads into most mafsikim.", tip: "If a pesik (׀) follows the word, sing that word with the Pesik sound instead, on the letter that has the Shofar Holekh under it.", seeAlso: "shofar-holekh-pesik" },
  { id: "shofar-mehuppakh", syrian: "Shofar Mehuppakh", hebrew: "שופר מהופך", ashkenazi: "Mahpach", sample: `${A}֤`, role: "mesharet", note: "Leads into Kadma." },
  { id: "darga", syrian: "Darga", hebrew: "דרגא", ashkenazi: "Darga", sample: `${A}֧`, role: "mesharet", note: "Leads into Tebir." },
  { id: "azla", syrian: "Azla", hebrew: "אזלא", ashkenazi: "Kadma", sample: `${A}֨`, role: "mesharet", note: "Leads into Gerish." },
  { id: "tilsa", syrian: "Tilsa", hebrew: "תילשׂא", ashkenazi: "Telisha Ketana", sample: `${A}֩`, role: "mesharet", note: "Written at the end of the word. Not the same as Talsha: it has its own sound." },
  { id: "tere-taame", syrian: "Tere Ta'ame", hebrew: "תרי טעמי", ashkenazi: "Mercha Kefula", sample: `${A}֦`, role: "mesharet", note: "A double Ma'arikh." },
];

/**
 * Ta'amei Emet: Tehillim, Mishlei and Iyov. A different system with its own
 * te'amim. The Pizmonim Project names the mafsikim but not the mesharetim,
 * so mesharet names here are the common textbook names: check them.
 */
export const EMET_TEAMIM: TaamReference[] = [
  { syrian: "Sof Pasuk", hebrew: "סוף פסוק", ashkenazi: "Silluk", sample: `${A}ֽ׃`, role: "mafsik", level: 1, note: "Ends the pasuk." },
  { syrian: "Oleh ve-Yored", hebrew: "עולה ויורד", ashkenazi: "Ole ve-Yored", sample: `${A}֫${A}֥`, role: "mafsik", level: 1, note: "Ends the first part of a three-part pasuk." },
  { syrian: "Atnah", hebrew: "אתנח", ashkenazi: "Etnachta", sample: `${A}֑`, role: "mafsik", level: 1, note: "Ends the first part of a two-part pasuk." },
  { syrian: "Rebia Gadol", hebrew: "רביע גדול", ashkenazi: "Revia Gadol", sample: `${A}֗`, role: "mafsik", level: 2 },
  { syrian: "Rebia Megurash", hebrew: "רביע מוגרש", ashkenazi: "Revia Mugrash", sample: `${A}֝${A}֗`, role: "mafsik", level: 2, note: "May divide the last part of the pasuk." },
  { syrian: "Tsinnor", hebrew: "צנור", ashkenazi: "Tsinnor", sample: `${A}֮`, role: "mafsik", level: 2, note: "Looks like Zarka." },
  { syrian: "Dehi", hebrew: "דחי", ashkenazi: "Dechi", sample: `${A}֭`, role: "mafsik", level: 2, note: "Looks like Tarha, but sits in a different place on the word." },
  { syrian: "Rebia Katon", hebrew: "רביע קטן", ashkenazi: "Revia Katon", sample: `${A}֗`, role: "mafsik", level: 3, note: "Right before Oleh ve-Yored." },
  { syrian: "Pazer Gadol", hebrew: "פזר גדול", ashkenazi: "Pazer", sample: `${A}֡`, role: "mafsik", level: 3 },
  { syrian: "Shalshelet Gedola", hebrew: "שלשלת גדולה", ashkenazi: "Shalshelet Gedola", sample: `${A}֓ ׀`, role: "mafsik", level: 3, note: "Followed by a Pesik." },
  { syrian: "Kadma Legarmeh", hebrew: "קדמא לגרמיה", ashkenazi: "Azla Legarmeh", sample: `${A}֨ ׀`, role: "mafsik", level: 3, note: "Followed by a Pesik." },
  { syrian: "Mehuppakh Legarmeh", hebrew: "מהופך לגרמיה", ashkenazi: "Mahpach Legarmeh", sample: `${A}֤ ׀`, role: "mafsik", level: 3, note: "Followed by a Pesik." },
  // Conjunctives (textbook names)
  { syrian: "Ma'arikh", hebrew: "מאריך", ashkenazi: "Mercha", sample: `${A}֥`, role: "mesharet" },
  { syrian: "Shofar Holekh", hebrew: "שופר הולך", ashkenazi: "Munach", sample: `${A}֣`, role: "mesharet" },
  { syrian: "Mehuppakh", hebrew: "מהופך", ashkenazi: "Mahpach", sample: `${A}֤`, role: "mesharet", note: "Can begin a part of the pasuk." },
  { syrian: "Illuy", hebrew: "עילוי", ashkenazi: "Illuy", sample: `${A}֬`, role: "mesharet" },
  { syrian: "Tarha", hebrew: "טרחא", ashkenazi: "Tarcha", sample: `${A}֖`, role: "mesharet", note: "In these books it connects (Dehi is the pause)." },
  { syrian: "Galgal", hebrew: "גלגל", ashkenazi: "Galgal / Yerach", sample: `${A}֪`, role: "mesharet" },
  { syrian: "Azla", hebrew: "אזלא", ashkenazi: "Azla / Kadma", sample: `${A}֨`, role: "mesharet" },
  { syrian: "Shalshelet Ketana", hebrew: "שלשלת קטנה", ashkenazi: "Shalshelet Ketana", sample: `${A}֓`, role: "mesharet", note: "No Pesik after it." },
  { syrian: "Tsinnorit", hebrew: "צנורית", ashkenazi: "Tsinnorit", sample: `${A}֘`, role: "mesharet" },
];

export type TanakhSection = "torah" | "neviim" | "ketuvim";

export interface TanakhBook {
  id: string;
  he: string;
  en: string;
  section: TanakhSection;
  system: TeamimSystem;
  /** How the Syrian community chants this book. */
  melody: string;
  /** Extra detail about when it's read, if any. */
  note?: string;
  /** Id of this book's course in the practice curriculum, when it has lessons. */
  courseId?: string;
}

const NEVIIM = "Haftarah (Nevi'im) melody";
const RUTH_TUNE = "Read to the tune of Ruth (Maqam Hoseni)";

/** The 24 books of Tanakh in traditional order. */
export const TANAKH: TanakhBook[] = [
  { id: "bereshit", he: "בראשית", en: "Bereshit", section: "torah", system: "prose", melody: "Torah melody · Maqam Sigah", courseId: "bereishit" },
  { id: "shemot", he: "שמות", en: "Shemot", section: "torah", system: "prose", melody: "Torah melody · Maqam Sigah" },
  { id: "vayikra", he: "ויקרא", en: "Vayikra", section: "torah", system: "prose", melody: "Torah melody · Maqam Sigah" },
  { id: "bamidbar", he: "במדבר", en: "Bamidbar", section: "torah", system: "prose", melody: "Torah melody · Maqam Sigah" },
  { id: "devarim", he: "דברים", en: "Devarim", section: "torah", system: "prose", melody: "Torah melody · Maqam Sigah" },

  { id: "yehoshua", he: "יהושע", en: "Yehoshua", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "shofetim", he: "שופטים", en: "Shofetim", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "shemuel", he: "שמואל", en: "Shemuel", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "melakhim", he: "מלכים", en: "Melakhim", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "yeshayahu", he: "ישעיהו", en: "Yeshayahu", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "yirmeyahu", he: "ירמיהו", en: "Yirmeyahu", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "yehezkel", he: "יחזקאל", en: "Yehezkel", section: "neviim", system: "prose", melody: NEVIIM },
  { id: "tere-asar", he: "תרי עשר", en: "Tere Asar", section: "neviim", system: "prose", melody: NEVIIM, note: "The twelve minor prophets." },

  { id: "tehillim", he: "תהלים", en: "Tehillim", section: "ketuvim", system: "emet", melody: "Own melody · Maqam Nahwand" },
  { id: "mishle", he: "משלי", en: "Mishle", section: "ketuvim", system: "emet", melody: "Own melody · Maqam Sigah (not the Torah tune)" },
  { id: "iyov", he: "איוב", en: "Iyov", section: "ketuvim", system: "emet", melody: "Own melody · an old form of Maqam Rast", note: "Chapters 1 to 3:1 are prose and are read like Ruth; the Iyov tune starts at 3:2." },
  { id: "shir-hashirim", he: "שיר השירים", en: "Shir HaShirim", section: "ketuvim", system: "prose", melody: "Own melody · Maqam Bayat", note: "Read on Friday nights." },
  { id: "ruth", he: "רות", en: "Ruth", section: "ketuvim", system: "prose", melody: "Own melody · Maqam Hoseni", note: "Read on Shavuot." },
  { id: "eikha", he: "איכה", en: "Eikha", section: "ketuvim", system: "prose", melody: "Own melody · Maqam Ajam", note: "Read on Tisha B'Av." },
  { id: "kohelet", he: "קהלת", en: "Kohelet", section: "ketuvim", system: "prose", melody: RUTH_TUNE },
  { id: "ester", he: "אסתר", en: "Ester", section: "ketuvim", system: "prose", melody: "Own melody · Maqam Saba-Mouhayar", note: "Read on Purim." },
  { id: "daniel", he: "דניאל", en: "Daniel", section: "ketuvim", system: "prose", melody: RUTH_TUNE },
  { id: "ezra-nehemia", he: "עזרא ונחמיה", en: "Ezra-Nehemia", section: "ketuvim", system: "prose", melody: RUTH_TUNE },
  { id: "divre-hayamim", he: "דברי הימים", en: "Divre HaYamim", section: "ketuvim", system: "prose", melody: RUTH_TUNE },
];

export const SECTION_TITLES: Record<TanakhSection, { he: string; en: string }> = {
  torah: { he: "תורה", en: "Torah" },
  neviim: { he: "נביאים", en: "Nevi'im" },
  ketuvim: { he: "כתובים", en: "Ketuvim" },
};
