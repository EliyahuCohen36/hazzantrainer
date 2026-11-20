import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "Patah Genuva · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "genuva")!.level;

/** Step 7: Patah Genuva. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Patah Genuva" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 7: Patah Genuva</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          פַּתַח גְּנוּבָה
        </span>
      </div>
      <p className="mb-5 text-stone-600">A Patah under ח, ע or הּ at the end of a word is said before the letter, with a little “w” or “y” sound.</p>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["genuva"]} />
      </BeginnerLock>
    </main>
  );
}
