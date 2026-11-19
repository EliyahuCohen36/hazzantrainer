import Link from "next/link";
import { SECTION_TITLES, type TanakhBook } from "@/data/teamim-reference";
import { bookParts, MEGILLOT } from "@/data/tanakh";
import { TUNE_SETS } from "@/data/tanakh-recordings";

/** A Nevi'im or Ketuvim book: its chapters (grouped by part in combined books). */
export function BookChapters({ book }: { book: TanakhBook }) {
  const parts = bookParts(book.id);
  const title = SECTION_TITLES[book.section];
  // Ketuvim: the te'amim trainer of this book's melody is here, inside the book (owner's request).
  const tune = book.section === "ketuvim" ? TUNE_SETS.find((t) => t.id !== "torah" && t.books.includes(book.id)) : undefined;
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/tanakh/${book.section}/`} className="hover:underline">
          {title.en}
        </Link>
        <span className="mx-1.5">/</span>
        {book.en}
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">{book.en}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-stone-700">
          {book.he}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {book.melody}
        {book.note && <span className="text-stone-400"> · {book.note}</span>}
      </p>
      {book.system === "emet" && (
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
          This book has its own te&apos;amim, the Ta&apos;amei Emet. Turn on &ldquo;Ta&apos;am names&rdquo; on a chapter to
          see each one.
        </p>
      )}
      {MEGILLOT.has(book.id) && (
        <p className="mt-2 text-sm text-stone-600">Each chapter can also be shown in Scroll Mode, as it&apos;s written in the megillah.</p>
      )}

      {tune && (
        <Link
          href={`/teamim/${tune.id}/`}
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-colors hover:bg-amber-100"
        >
          <span>
            <span className="block font-semibold text-stone-900">Te&apos;amim trainer for {book.en} →</span>
            <span className="block text-sm text-stone-600">Learn the te&apos;amim with this book&apos;s melody, one at a time.</span>
          </span>
          <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            טעמי {tune.he}
          </span>
        </Link>
      )}

      <div className="mt-5 space-y-5">
        {parts.map((p, i) => (
          <section key={i} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            {p.en && (
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-stone-900">{p.en}</h2>
                <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
                  {p.he}
                </span>
              </div>
            )}
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5">
              {p.chapters.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/tanakh/${book.section}/${book.id}/${c.slug}/`}
                    className="flex h-11 items-center justify-center rounded-lg text-sm font-medium tabular-nums text-stone-800 ring-1 ring-stone-200 transition-colors hover:bg-amber-50 hover:ring-amber-300"
                    title={`Chapter ${c.c} (${c.verses} pesukim)`}
                  >
                    {c.c}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-stone-400">
        Text: Miqra According to the Masorah (Hebrew Wikisource, CC BY-SA 4.0).
      </p>
    </main>
  );
}
