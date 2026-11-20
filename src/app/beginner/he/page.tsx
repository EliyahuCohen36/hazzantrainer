import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "The four kinds of He · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "he")!.level;

/** Step 9: He HaMegamah, He HaYedi'ah, He HaShe'elah and Mappiq He. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The four kinds of He" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 9: The four kinds of He</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          אַרְבָּעָה סוּגֵי ה״א
        </span>
      </div>
      <p className="mb-5 text-stone-600">A ה can mean four different things. Look where it is in the word and what nekudot it has.</p>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["he"]} />
      </BeginnerLock>
    </main>
  );
}
