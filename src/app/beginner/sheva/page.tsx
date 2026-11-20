import type { Metadata } from "next";
import Link from "next/link";
import { SHEVA_LEVEL } from "@/data/beginner";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTabs } from "@/components/beginner/ShevaTabs";

export const metadata: Metadata = { title: "The Sheva · Beginner Keriah" };

/** The Sheva: its own section, opened after all the letters and the other nekudot. */
export default function ShevaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The Sheva" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 5: The Sheva</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          שְׁוָא נָע וּשְׁוָא נָח
        </span>
      </div>

      <BeginnerLock need={SHEVA_LEVEL}>
        <p className="mb-5 text-stone-600">
          The Sheva is two dots, one above the other, under a letter (בְ). Sometimes it says a short &ldquo;e&rdquo;:
          that is a <b>Sheva Na</b>. Sometimes it is silent: that is a <b>Sheva Nach</b>. Each level starts by showing you what
          it&apos;s about, then the questions.
        </p>

        <ShevaTabs />
      </BeginnerLock>

      <div className="mt-10 flex justify-start">
        <Link href="/beginner/words/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
          ← Practice words
        </Link>
      </div>
    </main>
  );
}
