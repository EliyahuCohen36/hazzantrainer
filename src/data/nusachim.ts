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
  { id: "syrian", en: "Syrian (Aleppo)", he: "סורי (ארם צובא)", ready: true },
  { id: "ashkenaz", en: "Ashkenaz", he: "אשכנז", ready: false },
  { id: "yerushalmi", en: "Yerushalmi", he: "ירושלמי", ready: false },
  { id: "egyptian", en: "Egyptian", he: "מצרי", ready: false },
  { id: "moroccan", en: "Moroccan", he: "מרוקאי", ready: false },
];
