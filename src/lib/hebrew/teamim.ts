import type { TaamId } from "@/types/curriculum";

/**
 * Cantillation mark catalog.
 *
 * `syrian` holds the names used in the Syrian / Aleppo tradition, matching
 * the reference page (src/data/teamim-reference.ts, from pizmonim.org).
 * Naming varies between communities and teachers. Please confirm these with
 * your Hazzan; this file is the single place to change them.
 *
 * `pauseMs` sets how long a student must pause after each mafsik.
 */
export interface TaamInfo {
  id: TaamId;
  /** The Unicode combining mark. */
  mark: string;
  hebrew: string;
  /** Common Ashkenazi / academic name. */
  standard: string;
  /** Syrian (Halabi) name. */
  syrian: string;
  /** Disjunctive (pausal, mafsik) or conjunctive (connecting, mesharet). */
  role: "disjunctive" | "conjunctive";
  /**
   * The shortest break (milliseconds of near-silence) the student must leave
   * after a word with this ta'am. 0 = no pause needed (conjunctives).
   * Bigger "kings" get longer pauses. Change these to match how you teach.
   * Silluk ends the pasuk, so its pause isn't checked.
   */
  pauseMs: number;
}

export const TEAMIM: Record<TaamId, TaamInfo> = {
  etnachta: { id: "etnachta", mark: "֑", hebrew: "אתנח", standard: "Etnachta", syrian: "Atnah", role: "disjunctive", pauseMs: 250 },
  tipcha: { id: "tipcha", mark: "֖", hebrew: "טרחא", standard: "Tipcha", syrian: "Tarha", role: "disjunctive", pauseMs: 150 },
  mercha: { id: "mercha", mark: "֥", hebrew: "מאריך", standard: "Mercha", syrian: "Ma'arikh", role: "conjunctive", pauseMs: 0 },
  munach: { id: "munach", mark: "֣", hebrew: "שופר הולך", standard: "Munach", syrian: "Shofar Holekh", role: "conjunctive", pauseMs: 0 },
  silluk: { id: "silluk", mark: "ֽ", hebrew: "סוף פסוק", standard: "Silluk / Sof Pasuk", syrian: "Sof Pasuk", role: "disjunctive", pauseMs: 250 },
  "zakef-katon": { id: "zakef-katon", mark: "֔", hebrew: "זקף קטן", standard: "Zakef Katon", syrian: "Zakef Katon", role: "disjunctive", pauseMs: 150 },
  revia: { id: "revia", mark: "֗", hebrew: "רביע", standard: "Revia", syrian: "Rebia", role: "disjunctive", pauseMs: 100 },
  pashta: { id: "pashta", mark: "֙", hebrew: "פשטא", standard: "Pashta", syrian: "Kadma", role: "disjunctive", pauseMs: 100 },
  tevir: { id: "tevir", mark: "֛", hebrew: "תביר", standard: "Tevir", syrian: "Tebir", role: "disjunctive", pauseMs: 100 },
  darga: { id: "darga", mark: "֧", hebrew: "דרגא", standard: "Darga", syrian: "Darga", role: "conjunctive", pauseMs: 0 },
  kadma: { id: "kadma", mark: "֨", hebrew: "קדמא", standard: "Kadma", syrian: "Azla", role: "conjunctive", pauseMs: 0 },
  geresh: { id: "geresh", mark: "֜", hebrew: "גרש", standard: "Geresh", syrian: "Gerish", role: "disjunctive", pauseMs: 80 },
  gershayim: { id: "gershayim", mark: "֞", hebrew: "גרשיים", standard: "Gershayim", syrian: "Shene Gerishin", role: "disjunctive", pauseMs: 80 },
  "telisha-ketana": { id: "telisha-ketana", mark: "֩", hebrew: "תלישא קטנה", standard: "Telisha Ketana", syrian: "Tilsa", role: "conjunctive", pauseMs: 0 },
  "telisha-gedola": { id: "telisha-gedola", mark: "֠", hebrew: "תלישא גדולה", standard: "Telisha Gedola", syrian: "Talsha", role: "disjunctive", pauseMs: 80 },
  segol: { id: "segol", mark: "֒", hebrew: "סגולתא", standard: "Segol", syrian: "Segolta", role: "disjunctive", pauseMs: 150 },
  zarka: { id: "zarka", mark: "֮", hebrew: "זרקא", standard: "Zarka", syrian: "Zarka", role: "disjunctive", pauseMs: 100 },
  pazer: { id: "pazer", mark: "֡", hebrew: "פזר", standard: "Pazer", syrian: "Pazer Gadol", role: "disjunctive", pauseMs: 80 },
};

export function getTaam(id: TaamId | undefined): TaamInfo | undefined {
  return id ? TEAMIM[id] : undefined;
}
