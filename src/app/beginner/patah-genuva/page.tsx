import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { ShevaTrainer } from "@/components/beginner/ShevaTrainer";
import { SHEVA_STAGES } from "@/data/sheva-stages";

export const metadata: Metadata = { title: "Patah Genuva · Beginner Keriah" };

const FIRST = SHEVA_STAGES.find((s) => s.part === "genuva")!.level;

/** Step 8: Patah Genuva. */
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Patah Genuva" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Step 8: Patah Genuva</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          פַּתַח גְּנוּבָה
        </span>
      </div>
      <p className="mb-5 text-stone-600">A Patah under ח, ע or הּ at the end of a word is said before the letter, with a little “w” or “y” sound.</p>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 p-4">
          <p className="font-semibold text-stone-900">After &ldquo;o&rdquo; or &ldquo;u&rdquo;: a &ldquo;w&rdquo; sound</p>
          <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">נֹחַ · תַּפּוּחַ</p>
          <p className="text-sm text-stone-700" dir="ltr">no-waḥ · ta-pu-waḥ</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-stone-900">After &ldquo;e&rdquo; or &ldquo;i&rdquo;: a &ldquo;y&rdquo; sound</p>
          <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">רֵיחַ · שִׂיחַ</p>
          <p className="text-sm text-stone-700" dir="ltr">re-yaḥ · si-yaḥ</p>
        </div>
      </div>
      <BeginnerLock need={FIRST}>
        <ShevaTrainer parts={["genuva"]} />
      </BeginnerLock>
    </main>
  );
}
