import type { Metadata } from "next";
import Link from "next/link";
import { BEGINNER_STEPS } from "@/data/beginner";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLevelPath } from "@/components/beginner/Lock";
import { STEP_COLORS, StepPicture } from "@/components/beginner/StepPictures";

export const metadata: Metadata = { title: "Beginner Keriah · Keriah Trainer" };

/** Beginner Keriah: the alef-bet, the sofiyot and the nekudot, for first-time readers. */
export default function BeginnerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav />
      <div className="mt-2 rounded-3xl bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100 p-6 sm:p-10">
        <p dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          קְרִיאָה לְמַתְחִילִים
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-stone-900 sm:text-4xl">Beginner Keriah</h1>
        <p className="mt-2 max-w-xl text-stone-700">
          Learning to read Hebrew for the first time, step by step: first the letters, then the nekudot, then every letter
          with every nekuda. Tap a tile to hear it.
        </p>
        <p dir="rtl" lang="he" className="mt-5 font-hebrew text-5xl tracking-wide text-stone-800 sm:text-6xl">
          א בּ ג ד ה
        </p>
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {BEGINNER_STEPS.map((s, i) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className={`flex h-full items-start gap-4 rounded-2xl border-2 p-5 shadow-sm transition-colors ${STEP_COLORS[i].card}`}
            >
              <span className="flex shrink-0 items-center justify-center rounded-2xl bg-white/80 p-1 shadow-sm">
                <StepPicture i={i} className="h-16 w-20" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${STEP_COLORS[i].label}`}>Step {i + 1}</span>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-lg font-semibold text-stone-900">{s.title}</span>
                  <span dir="rtl" lang="he" className={`font-hebrew text-lg ${STEP_COLORS[i].he}`}>
                    {s.he}
                  </span>
                </span>
                <span className="mt-1 block text-sm text-stone-600">{s.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <BeginnerLevelPath />
    </main>
  );
}
