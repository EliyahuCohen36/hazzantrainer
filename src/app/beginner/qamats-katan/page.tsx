import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "Qamats Katan · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "katan")!.level;

/** Step 6: the Qamats Katan. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Qamats Katan" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 6: Qamats Katan</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          קָמָץ קָטָן
        </span>
      </div>
      <p className="mb-5 text-stone-600">The same Qamats sign can say “a” (Qamats Gadol) or “o” (Qamats Katan). Learn how to tell them apart, with real words from the Torah.</p>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["katan"]} />
      </BeginnerLock>
    </main>
  );
}
