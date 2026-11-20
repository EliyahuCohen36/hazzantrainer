import type { Metadata } from "next";
import Link from "next/link";
import { CHART_LEVEL, LETTER_BY_ID, NEKUDOT, withNekuda } from "@/data/beginner";
import { BeginnerLock, LockTile } from "@/components/beginner/Lock";
import { NEKUDA_GROUPS, groupLevel } from "@/data/nekuda-groups";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { NekudotStep } from "@/components/beginner/NekudotStep";
import { FullChart } from "@/components/beginner/FullChart";

export const metadata: Metadata = { title: "The Nekudot · Beginner Keriah" };

/**
 * Step 3: the Nekudot. The practice levels come first; each level shows its own nekudot with every
 * letter when it opens. The whole chart (the old step 4) is the second tab (owner, Nov 20).
 */
export default function NekudotPage() {
  const bet = LETTER_BY_ID.get("bet")!;
  const alef = LETTER_BY_ID.get("alef")!;
  const sample = (ids: string[]) =>
    ids
      .map((id) => {
        const n = NEKUDOT.find((x) => x.id === id)!;
        return withNekuda(id.startsWith("hataf") ? alef : bet, n);
      })
      .join(" ");
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The Nekudot" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 3: The Nekudot</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          נְקוּדוֹת
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        Nekudot are the dots and lines that tell us how to say a letter. Open a level to see its nekudot with every letter,
        then practice.
      </p>

      <BeginnerLock need={5}>
        <NekudotStep
          levels={
            <ol className="grid gap-3 sm:grid-cols-2">
              {NEKUDA_GROUPS.map((g, k) => (
                <li key={g.id}>
                  <LockTile need={g.id === "all" ? CHART_LEVEL : groupLevel(g)}>
                    <Link
                      href={`/beginner/nekudot/practice/${g.id}/`}
                      className="flex items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 hover:bg-emerald-100"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
                        {k + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-stone-900">{g.title}</span>
                        <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
                          {g.id === "all" ? g.he : sample(g.nekudot)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-emerald-800">Open →</span>
                    </Link>
                  </LockTile>
                </li>
              ))}
            </ol>
          }
          chart={
            <div>
              <p className="mb-3 text-stone-600">
                Read each row from right to left. An empty box means that letter doesn&apos;t take that nekuda. Final letters
                never take a nekuda, except Khaf Sofit with a Qamats (ךָ).
              </p>
              <BeginnerLock need={CHART_LEVEL}>
                <FullChart />
              </BeginnerLock>
            </div>
          }
        />
      </BeginnerLock>

      <div className="mt-10 flex justify-between">
        <Link href="/beginner/letters/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
          ← The Alef-Bet
        </Link>
        <Link href="/beginner/words/" className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
          Practice words →
        </Link>
      </div>
    </main>
  );
}
