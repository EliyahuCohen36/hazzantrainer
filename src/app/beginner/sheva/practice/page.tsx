import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_LEVEL } from "@/data/beginner";

export const metadata: Metadata = { title: "Sheva and Qamats Katan practice · Beginner Keriah" };

export default function ShevaPracticePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Sheva practice" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Sheva and Qamats Katan</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          שְׁוָא וְקָמָץ קָטָן
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        Step by step, with real words from the Torah: first the Sheva Nach after each short vowel, then the Sheva Na after
        each long vowel, then the other Sheva rules, and then the Qamats Katan. A Qamats followed by a Sheva has a
        ma&apos;amid under it when it&apos;s a regular &ldquo;a&rdquo;.
      </p>
      <BeginnerLock need={SHEVA_LEVEL}>
        <ShevaTrainer />
      </BeginnerLock>
    </main>
  );
}
