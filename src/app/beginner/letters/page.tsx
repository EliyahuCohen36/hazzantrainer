import type { Metadata } from "next";
import Link from "next/link";
import { LETTERS, LETTER_BY_ID, SOFIYOT, letterLevel } from "@/data/beginner";
import { BeginnerLock, LockTile } from "@/components/beginner/Lock";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { Tile } from "@/components/beginner/Tile";
import { SpeedControl } from "@/components/audio/SpeedControl";

export const metadata: Metadata = { title: "The Alef-Bet · Beginner Keriah" };

/** Every letter with its name and sound, then the five sofiyot beside their regular letters. */
export default function LettersPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The Alef-Bet" />
      <div className="mt-1 mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">The Alef-Bet</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          אָלֶף בֵּית
        </span>
      </div>
      <p className="mb-4 text-stone-600">
        Each letter with its name and the sound it makes. Some letters change their sound with a dot inside (a dagesh), so
        they have two tiles: Bet and Vet, Kaf and Khaf, Pe and Fe, and Shin and Sin.
      </p>
      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <b>Alef (א) and He (ה) have no sound by themselves.</b> Alone, without a nekuda, they are silent. They only make
        a sound when they have a nekuda: אָ says &ldquo;a&rdquo;, הָ says &ldquo;ha&rdquo;.
      </p>
      <div className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
        <SpeedControl compact />
      </div>

      <div dir="rtl" className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
        {LETTERS.map((l) => (
          <LockTile key={l.id} need={letterLevel(l.id)}>
            <Tile glyph={l.char} label={l.name} sub={l.sound} rec={`letter:${l.id}`} />
          </LockTile>
        ))}
      </div>

      <section id="sofiyot" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold text-stone-900">Final letters</h2>
          <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
            אוֹתִיּוֹת סוֹפִיּוֹת
          </span>
        </div>
        <p className="mt-1 mb-4 text-stone-600">
          Five letters look different when they come at the end of a word. They sound the same as the regular letter.
        </p>
        <BeginnerLock need={4}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOFIYOT.map((s) => {
            const reg = LETTER_BY_ID.get(s.of)!;
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                <div className="grid flex-1 grid-cols-2 gap-2" dir="rtl">
                  <Tile glyph={reg.char} label={reg.name} sub="in a word" rec={`letter:${reg.id}`} size="md" />
                  <Tile glyph={s.char} label={s.name} sub="at the end" rec={`letter:${s.id}`} color="amber" size="md" />
                </div>
              </div>
            );
          })}
        </div>
        </BeginnerLock>
      </section>

      <div className="mt-10 flex justify-end">
        <Link href="/beginner/nekudot/" className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
          Next: the Nekudot →
        </Link>
      </div>
    </main>
  );
}
