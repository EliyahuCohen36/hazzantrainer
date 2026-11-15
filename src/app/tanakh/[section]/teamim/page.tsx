import type { Metadata } from "next";
import Link from "next/link";
import { TorahTeamim } from "@/components/tanakh/TorahTeamim";

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
      <TorahTeamim />
      <p className="mt-6 text-sm">
        <Link href="/tanakh/torah/" className="text-amber-800 hover:underline">
          ← Back to the Torah
        </Link>
      </p>
    </main>
  );
}
