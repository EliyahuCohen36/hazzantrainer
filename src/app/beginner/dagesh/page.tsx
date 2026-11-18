import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "Dagesh Kal and Dagesh Hazaq · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "dagesh")!.level;

/** Step 9: Dagesh Kal and Dagesh Hazaq. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Dagesh Kal and Dagesh Hazaq" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 9: Dagesh Kal and Dagesh Hazaq</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          דָּגֵשׁ קַל וְדָגֵשׁ חָזָק
        </span>
      </div>
      <p className="mb-5 text-stone-600">The dot inside a letter is a Dagesh. At the start of a word in בּ גּ דּ כּ פּ תּ it is a Dagesh Kal (soft); right after a short vowel it is a Dagesh Hazaq (strong: the letter is said twice).</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4">
          <p className="font-semibold text-stone-900">Dagesh Kal: at the start of the word</p>
          <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">בֹּקֶר · דָּבָר · תּוֹרָה</p>
          <p className="text-sm text-stone-700">Only in בּ גּ דּ כּ פּ תּ</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-stone-900">Dagesh Hazaq: after a short vowel</p>
          <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">הַשָּׁמַיִם · נִצָּב</p>
          <p className="text-sm text-stone-700" dir="ltr">hash-sha-ma-yim · nits-tsav</p>
        </div>
      </div>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["dagesh"]} />
      </BeginnerLock>
    </main>
  );
}
