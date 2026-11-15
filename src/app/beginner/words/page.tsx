import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { WordPractice } from "@/components/beginner/WordPractice";
import { FIRST_WORD_LEVEL } from "@/data/beginner-words";

export const metadata: Metadata = { title: "Practice Words · Beginner Keriah" };

/** Reading real Torah words with the nekudot learned so far, graded. */
export default function WordsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Practice words" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Practice words</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          מִלִּים לְתַרְגּוּל
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        Real words from the Torah, using only the nekudot you have learned. Start with the newest nekudot: the words
        mix in the ones you learned before, so you keep practising them too.
      </p>
      <BeginnerLock need={FIRST_WORD_LEVEL}>
        <WordPractice />
      </BeginnerLock>
    </main>
  );
}
