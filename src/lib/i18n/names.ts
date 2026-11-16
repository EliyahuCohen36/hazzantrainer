/**
 * English names on the site → their Hebrew names (used for both Hebrew and
 * Arabic): books, parashiyot, aliyot, te'amim, letters and nekudot.
 */
import { TANAKH, PROSE_TEAMIM, EMET_TEAMIM } from "@/data/teamim-reference";
import { PARASHOT } from "@/data/parashot";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import { LETTERS, NEKUDOT } from "@/data/beginner";
import { PART_NAMES } from "@/data/tanakh-chapters";

const strip = (s: string) => s.replace(/[֑-ׇ]/g, "");

export function buildNames(): Map<string, string> {
  const m = new Map<string, string>();
  for (const b of TANAKH) m.set(b.en, b.he);
  for (const p of PARASHOT) m.set(p.en, p.he);
  for (const a of Object.values(ALIYAH_NAMES)) m.set(a.en, a.he);
  for (const t of [...PROSE_TEAMIM, ...EMET_TEAMIM]) m.set(t.syrian, t.hebrew);
  for (const l of LETTERS) m.set(l.name, strip(l.he));
  for (const n of NEKUDOT) m.set(n.name, strip(n.he));
  for (const parts of Object.values(PART_NAMES)) for (const p of parts) m.set(p.en, p.he);
  // Sofiyot ("Mem Sofit") and other names built from these.
  for (const l of LETTERS) m.set(`${l.name} Sofit`, `${strip(l.he)} סופית`);
  m.set("Melakhim I", "מלכים א");
  m.set("Melakhim II", "מלכים ב");
  m.set("Shemuel I", "שמואל א");
  m.set("Shemuel II", "שמואל ב");
  return m;
}
