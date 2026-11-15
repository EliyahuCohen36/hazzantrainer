import type { Metadata } from "next";
import { LETTERS, NEKUDOT, SOFIT_WITH_NEKUDA, withNekuda } from "@/data/beginner";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { BEGINNER_MAX } from "@/data/beginner";

export const metadata: Metadata = { title: "Letters with Nekudot · Beginner Keriah" };

/** The whole chart: every letter (rows) with every nekuda (columns), read right to left. */
export default function ChartPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Letters with Nekudot" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Letters with Nekudot</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          לוּחַ הַנְּקוּדוֹת
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        Read each row from right to left. An empty box means that letter doesn&apos;t take that nekuda. Final letters
        never take a nekuda, except Khaf Sofit with a Sheva (ךְ) or a Qamats (ךָ).
      </p>
      <BeginnerLock need={BEGINNER_MAX}>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table dir="rtl" className="min-w-full border-collapse text-center">
          <thead className="sticky top-0 bg-stone-50 text-xs text-stone-600">
            <tr>
              <th className="px-2 py-2 font-medium">Letter</th>
              {NEKUDOT.map((n) => (
                <th key={n.id} className="px-2 py-2 font-medium" dir="ltr">
                  {n.name}
                  <div className="text-[0.65rem] font-normal text-stone-400">{n.sound}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((l) => (
              <tr key={l.id} className="border-t border-stone-100">
                <th className="px-2 py-1 font-hebrew text-3xl font-normal text-amber-800">
                  {l.char}
                  <div className="font-sans text-[0.65rem] text-stone-400" dir="ltr">
                    {l.name}
                  </div>
                </th>
                {NEKUDOT.map((n) => {
                  const g = withNekuda(l, n);
                  return (
                    <td key={n.id} lang="he" className="px-2 py-1 font-hebrew text-3xl text-stone-900">
                      {g ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t-2 border-stone-200">
              <th className="px-2 py-1 font-hebrew text-3xl font-normal text-amber-800">
                ך
                <div className="font-sans text-[0.65rem] text-stone-400" dir="ltr">
                  Khaf Sofit
                </div>
              </th>
              {NEKUDOT.map((n) => (
                <td key={n.id} lang="he" className="px-2 py-1 font-hebrew text-3xl text-stone-900">
                  {SOFIT_WITH_NEKUDA.find((s) => s.nekuda === n.id)?.text ?? ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      </BeginnerLock>
    </main>
  );
}
