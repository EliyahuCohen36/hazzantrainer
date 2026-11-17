import type { Metadata } from "next";
import Link from "next/link";
import { SIDDUR_PARTS } from "@/data/siddur";

export const metadata: Metadata = { title: "Siddur · Kriah Trainer" };

/** The Siddur, nusach Edot HaMizrah: every part, with the Hazzan's recordings. */
export default function SiddurPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Kriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        Siddur
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">Siddur</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-amber-800">
          סידור עדות המזרח
        </span>
      </div>
      <p className="mt-2 text-stone-600">
        The whole Siddur in the Edot HaMizrah nusach. Tap a part, then press play beside any paragraph to hear the Hazzan
        say it. Where a paragraph is sung to a tune, choose the maqam.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {SIDDUR_PARTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/siddur/${p.slug}/`}
              className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-stone-900">{p.en}</span>
                <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
                  {p.he}
                </span>
              </span>
              <span dir="rtl" lang="he" className="mt-1 block truncate font-hebrew text-sm text-stone-500">
                {p.sections.map((s) => s.he).join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-stone-400">Text: Siddur Edot HaMizrah, Torat Emet (toratemetfreeware.com), via Sefaria.</p>
    </main>
  );
}
