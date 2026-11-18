import { NEKUDOT, nekudaLevel } from "./beginner";

/** The nekudot practice pages (/beginner/nekudot/practice/<id>/): nekudot that sound alike, practiced together. */
export interface NekudaGroup {
  id: string;
  title: string;
  he: string;
  nekudot: string[];
}

export const NEKUDA_GROUPS: NekudaGroup[] = [
  { id: "a", title: "Qamats and Patah", he: "קָמַץ פַּתַח", nekudot: ["qamats", "patah"] },
  { id: "e", title: "Sere and Segol", he: "צֵרֵי סֶגּוֹל", nekudot: ["sere", "segol"] },
  { id: "i", title: "Hireq", he: "חִירֶק", nekudot: ["hireq", "hireq-male"] },
  { id: "o", title: "Holem", he: "חוֹלֶם", nekudot: ["holem", "holem-male"] },
  { id: "u", title: "Qibbus and Shuruq", he: "קִבּוּץ שׁוּרֶק", nekudot: ["qibbus", "shuruq"] },
  { id: "hataf", title: "Hataf", he: "חֲטָפִים", nekudot: ["hataf-patah", "hataf-segol", "hataf-qamats"] },
  { id: "all", title: "All the nekudot", he: "הַכֹּל", nekudot: NEKUDOT.map((n) => n.id) },
];
export const groupLevel = (g: NekudaGroup) => Math.max(...g.nekudot.map(nekudaLevel));
export const nekudotKey = (g: string) => `beginner-nekudot:${g}`;
export const nekudaQuizKey = (id: string) => `beginner-nekuda:${id}`;

