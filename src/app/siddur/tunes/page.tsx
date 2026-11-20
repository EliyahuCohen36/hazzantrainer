import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SIDDUR_PARTS, TUNE_PARTS, tuneSpot, type SiddurPart } from "@/data/siddur";
import { TunesTabs } from "@/components/siddur/TunesTabs";

export const metadata: Metadata = { title: "Songs and maqam tunes · Keriah Trainer" };

/**
 * Songs and maqam tunes (owner, Nov 20): a chart of the parts of the Tefillah that are sung with tunes, each
 * linking straight to its place in the Siddur, and a Pizmonim tab.
 */
export default async function TunesPage() {
  const rows: { part: string; partEn: string; partHe: string; label: string; href: string }[] = [];
  for (const info of SIDDUR_PARTS.filter((p) => TUNE_PARTS.has(p.slug))) {
    const part = JSON.parse(await readFile(path.join(process.cwd(), "src/data/siddur", `${info.slug}.json`), "utf8")) as SiddurPart;
    const seen = new Set<string>();
    part.sections.forEach((sec, s) =>
      sec.paras.forEach((html, p) => {
        const spot = tuneSpot(info.slug, html, sec.he);
        if (spot && !seen.has(spot.label)) {
          seen.add(spot.label);
          rows.push({ part: info.slug, partEn: info.en, partHe: info.he, label: spot.label, href: `/siddur/${info.slug}/#p-${s + 1}-${p + 1}` });
        }
      }),
    );
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/siddur/" className="hover:underline">
          Siddur
        </Link>
        <span className="mx-1.5">/</span>
        Songs and maqam tunes
      </nav>
      <div className="mt-1 mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Songs and maqam tunes</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-sky-800">
          שִׁירִים וּמַקָאמוֹת
        </span>
      </div>
      <TunesTabs rows={rows} />
    </main>
  );
}
