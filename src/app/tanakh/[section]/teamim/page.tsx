import type { Metadata } from "next";
import Link from "next/link";
import { TeamimLevels } from "@/components/tanakh/TeamimLevels";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { AllTeamim } from "@/components/tanakh/AllTeamim";

export const metadata: Metadata = { title: "Te'amim trainer · Torah · Kriah Trainer" };

export function generateStaticParams() {
  return [{ section: "torah" }];
}

/** Learn the names and sounds of the te'amim of the Torah, with examples. */
export default function TorahTeamimPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Kriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/" className="hover:underline">
          Torah
        </Link>
        <span className="mx-1.5">/</span>
        Te&apos;amim trainer
      </nav>
      <div className="mt-1 mb-5 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">Te&apos;amim trainer</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          טעמי המקרא
        </span>
      </div>
      <AllTeamim />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/tanakh/torah/teamim/quiz/"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-colors hover:bg-amber-100"
        >
          <span className="block text-lg font-semibold text-stone-900">🎧 Listening quiz →</span>
          <span className="block text-sm text-stone-600">Hear the Hazzan sing a ta&apos;am and pick its sign (te&apos;amim from your open levels).</span>
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <span className="block text-lg font-semibold text-stone-900">🎤 Practice singing</span>
          <span className="block text-sm text-stone-600">
            Press <b>Practice</b> under a recording, sing it, and get stars. Get 2 stars on every ta&apos;am to finish a level.
          </span>
        </div>
      </div>
      <div className="sticky top-0 z-10 mb-4 sm:top-[3.4rem] rounded-xl border border-stone-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
        <SpeedControl />
      </div>
      <TeamimLevels />
      <p className="mt-6 text-sm">
        <Link href="/tanakh/torah/" className="text-amber-800 hover:underline">
          ← Back to the Torah
        </Link>
      </p>
    </main>
  );
}
