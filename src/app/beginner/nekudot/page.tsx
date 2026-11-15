import type { Metadata } from "next";
import Link from "next/link";
import { NEKUDOT, LETTER_BY_ID, withNekuda, nekudaLevel } from "@/data/beginner";
import { BeginnerLock, LockTile } from "@/components/beginner/Lock";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { Tile } from "@/components/beginner/Tile";

export const metadata: Metadata = { title: "The Nekudot · Beginner Keriah" };

const GROUPS = [
  { sound: "a", ids: ["qamats", "patah"] },
  { sound: "e", ids: ["sere", "segol"] },
  { sound: "i", ids: ["hireq", "hireq-male"] },
  { sound: "o", ids: ["holem", "holem-male"] },
  { sound: "u", ids: ["qibbus", "shuruq"] },
  { sound: "Short sounds (hataf)", ids: ["hataf-patah", "hataf-segol", "hataf-qamats"] },
];

/** The nekudot, grouped by the sound they make, each shown on Bet (or Alef for the hataf ones). */
export default function NekudotPage() {
  const bet = LETTER_BY_ID.get("bet")!;
  const alef = LETTER_BY_ID.get("alef")!;
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The Nekudot" />
      <div className="mt-1 mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">The Nekudot</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          נְקוּדוֹת
        </span>
      </div>
      <p className="mb-6 text-stone-600">
        Nekudot are the dots and lines that tell us how to say a letter. Two nekudot can make the same sound: Qamats and
        Patah both say &ldquo;a&rdquo;. Tap a nekuda to see it with every letter.
      </p>

      <BeginnerLock need={5}>
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <section key={g.sound}>
            <h2 className="mb-2 text-lg font-semibold text-stone-800">
              {g.sound.length === 1 ? <>Say &ldquo;{g.sound}&rdquo;</> : g.sound}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.ids.map((id) => {
                const n = NEKUDOT.find((x) => x.id === id)!;
                const glyph = withNekuda(id.startsWith("hataf") ? alef : bet, n)!;
                return (
                  <LockTile key={id} need={nekudaLevel(id)}>
                    <Link href={`/beginner/nekudot/${id}/`} className="block">
                      <Tile glyph={glyph} label={n.name} sub={n.he} color={n.color} still />
                    </Link>
                  </LockTile>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      </BeginnerLock>

      <div className="mt-10 flex justify-between">
        <Link href="/beginner/letters/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
          ← The Alef-Bet
        </Link>
        <Link href="/beginner/chart/" className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
          Every letter with every nekuda →
        </Link>
      </div>
    </main>
  );
}
