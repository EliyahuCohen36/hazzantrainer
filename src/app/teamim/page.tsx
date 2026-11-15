import type { Metadata } from "next";
import Link from "next/link";
import { TeamimBrowser } from "@/components/teamim/TeamimBrowser";

export const metadata: Metadata = {
  title: "Names of the Te'amim · Kriah Trainer",
  description: "The names of the te'amim in the Syrian tradition, for every book of Tanakh.",
};

export default function TeamimPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500">
        <Link href="/" className="hover:underline">
          Kriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/#tanakh" className="hover:underline">
          Tanakh
        </Link>
        <span className="mx-1.5">/</span>
        Te&apos;amim by book
      </nav>
      <div className="mt-1 mb-5 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold text-stone-900">Names of the Te&apos;amim</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-xl text-stone-600">
          שמות הטעמים
        </span>
      </div>
      <p className="mb-5 text-sm text-stone-600">
        Choose a book to see its te&apos;amim with their Syrian names, and the melody the Syrian community uses for it.
      </p>
      <TeamimBrowser />
      <p className="mt-6 text-xs text-stone-400">
        Names and melodies follow the Sephardic Pizmonim Project (pizmonim.org). Check them with your Hazzan.
      </p>
    </main>
  );
}
