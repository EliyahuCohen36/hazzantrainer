import { LETTERS, NEKUDOT, SOFIT_WITH_NEKUDA, spell, withNekuda } from "@/data/beginner";
import { Tile } from "./Tile";

/** One nekuda with every letter that takes it (tap to hear), and Khaf Sofit where it takes it. */
export function NekudaLetters({ id, small = false }: { id: string; small?: boolean }) {
  const n = NEKUDOT.find((x) => x.id === id);
  if (!n) return null;
  const sofit = SOFIT_WITH_NEKUDA.filter((s) => s.nekuda === n.id);
  const grid = small ? "grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8" : "grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7";
  return (
    <div dir="rtl" className={grid}>
      {LETTERS.map((l) => {
        const g = withNekuda(l, n);
        return g ? <Tile key={l.id} glyph={g} label={spell(l, n)} sub={l.name} color={n.color} rec={`sound:${l.id}:${n.id}`} /> : null;
      })}
      {sofit.map((s) => (
        <Tile key={s.text} glyph={s.text} label={s.sound} sub="Khaf Sofit" color={n.color} rec={`sound:${s.sofit}:${n.id}`} />
      ))}
    </div>
  );
}
