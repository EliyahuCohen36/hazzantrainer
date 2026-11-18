import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTabs } from "@/components/beginner/ShevaTabs";
import { SHEVA_LEVEL } from "@/data/beginner";

export const metadata: Metadata = { title: "The Sheva · Beginner Keriah" };

export default function ShevaPracticePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Sheva practice" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 6: The Sheva</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          שְׁוָא נָע וּשְׁוָא נָח
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        Step by step, with real words from the Torah: first the Sheva Nach rules, then the Sheva Na rules, then both
        mixed. A Qamats followed by a Sheva has a ma&apos;amid next to it.
      </p>
      <BeginnerLock need={SHEVA_LEVEL}>
        <ShevaTabs />
      </BeginnerLock>
    </main>
  );
}
