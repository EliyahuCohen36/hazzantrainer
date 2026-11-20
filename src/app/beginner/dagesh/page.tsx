import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "Dagesh Kal and Dagesh Hazaq · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "dagesh")!.level;

/** Step 8: Dagesh Kal and Dagesh Hazaq. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Dagesh Kal and Dagesh Hazaq" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 8: Dagesh Kal and Dagesh Hazaq</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          דָּגֵשׁ קַל וְדָגֵשׁ חָזָק
        </span>
      </div>
      <p className="mb-5 text-stone-600">The dot inside a letter is a Dagesh. At the start of a word in בּ גּ דּ כּ פּ תּ it is a Dagesh Kal (soft); right after a short vowel it is a Dagesh Hazaq (strong: the letter is said twice). A Dagesh Hazaq can be in almost any letter, not only בּ גּ דּ כּ פּ תּ (never in א ה ח ע ר).</p>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["dagesh"]} />
      </BeginnerLock>
    </main>
  );
}
