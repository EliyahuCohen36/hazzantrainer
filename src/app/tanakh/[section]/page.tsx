import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTION_TITLES, TANAKH, type TanakhSection } from "@/data/teamim-reference";
import { curriculum } from "@/lib/curriculum/repository";
import { PARASHOT } from "@/data/parashot";
import { TorahTabs } from "@/components/tanakh/TorahTabs";

const SECTIONS: TanakhSection[] = ["torah", "neviim", "ketuvim"];

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  const t = SECTION_TITLES[section as TanakhSection];
  return { title: t ? `${t.en} · Kriah Trainer` : "Kriah Trainer" };
}

/** Lessons available for a book (by its curriculum course id). */
async function lessonsFor(courseId: string | undefined) {
  if (!courseId) return [];
  const units = await curriculum.listUnits(courseId);
  return (await Promise.all(units.map((u) => curriculum.listLessons(u.id)))).flat();
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section as TanakhSection)) notFound();
  const s = section as TanakhSection;
  const title = SECTION_TITLES[s];
  const books = await Promise.all(
    TANAKH.filter((b) => b.section === s).map(async (b) => ({ book: b, lessons: await lessonsFor(b.courseId) })),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Kriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/#tanakh" className="hover:underline">
          Tanakh
        </Link>
        <span className="mx-1.5">/</span>
        {title.en}
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">{title.en}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-stone-700">
          {title.he}
        </span>
      </div>

      {s === "torah" && <TorahTabs current="tikkun" />}
      {s === "torah" && (
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Books of the Torah">
          {books.map(({ book }) => (
            <Link
              key={book.id}
              href={`/tanakh/torah/${book.id}/`}
              className="flex items-baseline gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 shadow-sm hover:border-amber-400 hover:bg-amber-50"
            >
              <span className="font-semibold text-stone-900">{book.en}</span>
              <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
                {book.he}
              </span>
            </Link>
          ))}
        </nav>
      )}
      {s === "torah" && (
        <div className="mt-5 space-y-5">
          {/* Te'amim trainer: its own page, one click from here. */}
          <Link
            href="/tanakh/torah/teamim/"
            className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition-colors hover:bg-amber-100"
          >
            <span>
              <span className="block text-lg font-semibold text-stone-900">Te&apos;amim trainer →</span>
              <span className="block text-sm text-stone-600">
                Learn the names and sounds of every ta&apos;am, practise singing them, and take the listening quiz.
              </span>
            </span>
            <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
              טעמי המקרא
            </span>
          </Link>

          {/* The five books, each with its parashiyot in order. */}
          {books.map(({ book, lessons }) => {
            const parashot = PARASHOT.filter((p) => p.book === book.id);
            return (
              <section key={book.id} id={book.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/tanakh/torah/${book.id}/`} className="text-xl font-semibold text-stone-900 hover:text-amber-800">
                    {book.en}
                  </Link>
                  <Link href={`/tanakh/torah/${book.id}/`} dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-800 hover:text-amber-800">
                    {book.he}
                  </Link>
                </div>
                <ol className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {parashot.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/tanakh/torah/${book.id}/${p.id}/`}
                        className="flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-stone-200 transition-colors hover:bg-amber-50 hover:ring-amber-300"
                      >
                        <span className="text-sm text-stone-800">
                          <span className="me-2 text-xs tabular-nums text-stone-400">{p.num}.</span>
                          {p.en}
                        </span>
                        <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
                          {p.he}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <Link href={`/tanakh/torah/${book.id}/`} className="text-amber-800 hover:underline">
                    Aliyot of each parasha →
                  </Link>
                  {lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/practice/${l.id}/`}
                      className="rounded-lg bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800"
                    >
                      Practice {l.title.en}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {s !== "torah" && (
      <div className="mt-5 space-y-5">
        <section id="books" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Books</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {books.map(({ book, lessons }) => (
              <li key={book.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex items-baseline gap-3">
                    <Link href={`/tanakh/${s}/${book.id}/`} dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-900 hover:text-amber-800">
                      {book.he}
                    </Link>
                    <Link href={`/tanakh/${s}/${book.id}/`} className="text-sm text-stone-500 hover:underline">
                      {book.en}
                    </Link>
                  </div>
                  <div className="text-xs text-stone-400">{book.melody}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/practice/${l.id}/`}
                      className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                    >
                      {l.title.en}
                    </Link>
                  ))}
                  <Link
                    href={`/tanakh/${s}/${book.id}/`}
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                  >
                    Read the text →
                  </Link>
                  <Link href={`/teamim/#${book.id}`} className="text-sm text-amber-800 hover:underline">
                    Te&apos;amim →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      )}
    </main>
  );
}
