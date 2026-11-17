import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SIDDUR_PARTS, type SiddurPart } from "@/data/siddur";
import { SiddurView } from "@/components/siddur/SiddurView";

export function generateStaticParams() {
  return SIDDUR_PARTS.map((p) => ({ part: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ part: string }> }): Promise<Metadata> {
  const { part } = await params;
  const p = SIDDUR_PARTS.find((x) => x.slug === part);
  return { title: p ? `${p.en} · Siddur · Kriah Trainer` : "Kriah Trainer" };
}

export default async function SiddurPartPage({ params }: { params: Promise<{ part: string }> }) {
  const { part: slug } = await params;
  const i = SIDDUR_PARTS.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const part = JSON.parse(await readFile(path.join(process.cwd(), "src/data/siddur", `${slug}.json`), "utf8")) as SiddurPart;
  const prev = SIDDUR_PARTS[i - 1];
  const next = SIDDUR_PARTS[i + 1];
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/siddur/" className="hover:underline">
          Siddur
        </Link>
        <span className="mx-1.5">/</span>
        {part.en}
      </nav>
      <div className="mt-1 mb-4 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">{part.en}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-amber-800">
          {part.he}
        </span>
      </div>
      <SiddurView part={part} />
      <div className="mt-6 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/siddur/${prev.slug}/`} className="text-amber-800 hover:underline">
            ← {prev.en}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/siddur/${next.slug}/`} className="text-amber-800 hover:underline">
            {next.en} →
          </Link>
        )}
      </div>
      <p className="mt-6 text-xs text-stone-400">Text: Siddur Edot HaMizrah, Torat Emet (toratemetfreeware.com), via Sefaria.</p>
    </main>
  );
}
