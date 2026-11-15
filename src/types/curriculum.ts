/**
 * Curriculum data model.
 *
 * Hierarchy (generic names → Torah-specific meaning):
 *
 *   Subject  → "Torah Reading", "Haftarah", "Tefillah", "Mishnah"
 *   Course   → a Sefer (Bereishit), a Siddur section, a Masechet
 *   Unit     → a Parasha, a single Haftarah, a prayer, a Perek
 *   Lesson   → a Pasuk, a paragraph of prayer, a single Mishnah
 *
 * Entities reference their parent by id (normalized, not deeply nested).
 * That maps 1:1 onto relational tables later (subjects, courses, units,
 * lessons, recordings), so moving from in-memory data to a database is
 * a change in the repository layer only, not in the components.
 */

/** Text in both languages. Hebrew is the source of truth; English is for UI. */
export interface LocalizedText {
  he: string;
  en: string;
}

export type SubjectKind = "torah" | "haftarah" | "tefillah" | "mishnah";

/**
 * Reading tradition (minhag). Recordings and ta'am names vary by tradition,
 * so it is stored on the recording rather than hard-coded in the UI.
 */
export type Tradition = "syrian";

export interface Subject {
  id: string;
  kind: SubjectKind;
  title: LocalizedText;
  description?: string;
  order: number;
}

export interface Course {
  id: string;
  subjectId: string;
  title: LocalizedText;
  order: number;
}

export interface Unit {
  id: string;
  courseId: string;
  title: LocalizedText;
  order: number;
}

/** A canonical reference, e.g. Sefaria-style "Genesis 1:1". */
export interface Citation {
  ref: string;
  label: LocalizedText;
}

/** Ids of the cantillation marks we know about. See lib/hebrew/teamim.ts. */
export type TaamId =
  | "etnachta"
  | "tipcha"
  | "mercha"
  | "munach"
  | "silluk"
  | "zakef-katon"
  | "revia"
  | "pashta"
  | "tevir"
  | "darga"
  | "kadma"
  | "geresh"
  | "gershayim"
  | "telisha-ketana"
  | "telisha-gedola"
  | "segol"
  | "zarka"
  | "pazer";

/**
 * The smallest unit the reader highlights and the trainer scores.
 * For Torah this is a word carrying one ta'am.
 */
export interface TextSegment {
  id: string;
  /** Fully pointed text: consonants + nikkud + te'amim (Unicode). */
  text: string;
  /** The ta'am that governs this word's melody, if any. */
  taam?: TaamId;
  /**
   * Number of syllables. Optional: it is worked out from the nikkud when
   * missing. Set it when the automatic count is wrong for a word.
   */
  syllables?: number;
}

/** Where a segment sits inside a specific recording (seconds). */
export interface SegmentTiming {
  segmentId: string;
  start: number;
  end: number;
  /**
   * The stressed syllable (the one carrying the ta'am), in seconds within the
   * same recording. Used to check the student sings the note on the right
   * part of the word. Leave out to skip that check for the word.
   */
  stressStart?: number;
  stressEnd?: number;
}

/**
 * A reference recording by a Hazzan. Timings belong to the recording,
 * not the text, because two readers will chant the same pasuk differently.
 */
export interface MasterRecording {
  id: string;
  /** Path under /public or an absolute URL (CDN / object storage later). */
  src: string;
  reader: string;
  tradition: Tradition;
  segmentTimings?: SegmentTiming[];
}

export interface Lesson {
  id: string;
  unitId: string;
  kind: "pasuk" | "paragraph" | "mishnah";
  title: LocalizedText;
  citation: Citation;
  order: number;
  segments: TextSegment[];
  recordings: MasterRecording[];
}

/** A lesson with its ancestors resolved, used for breadcrumbs and headers. */
export interface LessonContext {
  subject: Subject;
  course: Course;
  unit: Unit;
  lesson: Lesson;
}

/** The whole catalog, as a flat set of tables. */
export interface CurriculumData {
  subjects: Subject[];
  courses: Course[];
  units: Unit[];
  lessons: Lesson[];
}
