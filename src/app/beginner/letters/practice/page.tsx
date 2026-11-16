import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { LetterTrainer } from "@/components/beginner/LetterTrainer";

export const metadata: Metadata = { title: "Letter trainer · Beginner Keriah" };

export default function LetterTrainerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Letter trainer" />
      <div className="mt-1 mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Letter trainer</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          אוֹתִיּוֹת
        </span>
      </div>
      <LetterTrainer />
    </main>
  );
}
