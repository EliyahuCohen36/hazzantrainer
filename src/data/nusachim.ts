/**
 * The nusachim (reading traditions). Syrian is the one on the site now; each
 * other nusach gets its own recordings from a Hazzan of that tradition. When
 * one is ready, set `ready: true` and put its recordings under
 * nusach/<id>/... in the bucket (the Syrian ones stay where they are).
 */
export interface Nusach {
  id: string;
  en: string;
  he: string;
  ready: boolean;
}

export const NUSACHIM: Nusach[] = [
  { id: "syrian", en: "Syrian", he: "סורי", ready: true },
  // Same as Syrian except a few te'amim (Pazer Gadol, Tere Ta'ame) and the
  // Nevi'im and megillot tunes: those recordings go under nusach/yerushalmi/.
  { id: "yerushalmi", en: "Yerushalmi", he: "ירושלמי", ready: true },
  { id: "ashkenaz", en: "Ashkenaz", he: "אשכנז", ready: false },
];
