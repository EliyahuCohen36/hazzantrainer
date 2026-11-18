import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "The four kinds of He · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "he")!.level;

/** Step 10: He HaMegamah, He HaYedi'ah, He HaShe'elah and Mappiq He. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The four kinds of He" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 10: The four kinds of He</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          אַרְבָּעָה סוּגֵי ה״א
        </span>
      </div>
      <p className="mb-5 text-stone-600">A ה can mean four different things. Look where it is in the word and what nekudot it has.</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        {[
          ["He HaYedi'ah: “the”", "ה״א הַיְדִיעָה", "הַיֶּלֶד · הָאִישׁ", "the boy · the man"],
          ["He HaShe'elah: a yes/no question", "ה״א הַשְּׁאֵלָה", "הֲשָׁלוֹם לְךָ? · הַיָּדַעְתָּ?", "Is it well with you? · Did you know?"],
          ["He HaMegamah: towards a place", "ה״א הַמְּגַמָּה", "בֵּיתָה · מִצְרַיְמָה", "home · to Egypt"],
          ["Mappiq He: belongs to her", "ה״א מַפִּיק", "אַרְצָהּ · לָהּ", "her land · to her"],
        ].map(([t, h, ex, tr]) => (
          <div key={t} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="flex flex-wrap items-baseline justify-between gap-2 font-semibold text-stone-900">
              {t}
              <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">{h}</span>
            </p>
            <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">{ex}</p>
            <p className="text-sm text-stone-600">{tr}</p>
          </div>
        ))}
      </div>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["he"]} />
      </BeginnerLock>
    </main>
  );
}
