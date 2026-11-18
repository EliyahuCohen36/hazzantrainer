import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TUNE_SETS } from "@/data/tanakh-recordings";
import { TANAKH } from "@/data/teamim-reference";
import { TuneTrainer } from "@/components/tanakh/TuneTrainer";
import { SpeedControl } from "@/components/audio/SpeedControl";

const TUNES = TUNE_SETS.filter((t) => t.id !== "torah");

export function generateStaticParams() {
  return TUNES.map((t) => ({ tune: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ tune: string }> }): Promise<Metadata> {
  const { tune } = await params;
  const t = TUNES.find((x) => x.id === tune);
  return { title: t ? `Te'amim trainer · ${t.en} · Keriah Trainer` : "Keriah Trainer" };
}

/** The te'amim trainer for one melody of Tanakh (the Torah has its own, with more levels). */
export default async function TuneTrainerPage({ params }: { params: Promise<{ tune: string }> }) {
  const { tune } = await params;
  const t = TUNES.find((x) => x.id === tune);
  if (!t) notFound();
  const books = t.books.map((id) => TANAKH.find((b) => b.id === id)).filter(Boolean);
  const section = books[0]?.section ?? "ketuvim";
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/tanakh/${section}/`} className="hover:underline">
          {section === "neviim" ? "Nevi'im" : "Ketuvim"}
        </Link>
        <span className="mx-1.5">/</span>
        Te&apos;amim trainer
      </nav>
      <div className="mt-1 mb-2 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">Te&apos;amim trainer: {t.en}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          טעמי {t.he}
        </span>
      </div>
      <p className="mb-5 text-stone-600">
        {t.id === "neviim"
          ? "The te'amim of all the books of Nevi'im are sung with the same melody, so there is one trainer for all of them."
          : `The te'amim with the melody of ${t.en}.`}
      </p>
      <div className="sticky top-0 z-10 mb-4 rounded-xl border border-stone-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur sm:top-[3.4rem]">
        <SpeedControl />
      </div>
      <TuneTrainer tune={t} />
    </main>
  );
}
