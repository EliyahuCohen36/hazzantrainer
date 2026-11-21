import type { Metadata } from "next";
import Link from "next/link";
import { TeamimQuiz, TeamimWordsQuiz } from "@/components/tanakh/TeamimQuiz";

export const metadata: Metadata = { title: "Te'amim listening quiz · Keriah Trainer" };

export function generateStaticParams() {
  return [{ section: "torah" }];
}

export default function TeamimQuizPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/" className="hover:underline">
          Torah
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/teamim/" className="hover:underline">
          Te&apos;amim trainer
        </Link>
        <span className="mx-1.5">/</span>
        Quiz
      </nav>
      <h1 className="mt-1 mb-4 text-3xl font-semibold text-stone-900">Listening quiz</h1>
      <TeamimQuiz />
          <TeamimWordsQuiz />
    </main>
  );
}
