import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTION_TITLES, TANAKH, type TanakhSection } from "@/data/teamim-reference";
import { curriculum } from "@/lib/curriculum/repository";
import { PARASHOT } from "@/data/parashot";
import { TorahTeamim } from "@/components/tanakh/TorahTeamim";

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

      {s === "torah" && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href="#teamim" className="rounded-full bg-amber-100 px-3 py-1 text-amber-900 hover:bg-amber-200">
            Names of the Te&apos;amim
          </a>
          <a href="#books" className="rounded-full bg-stone-100 px-3 py-1 text-stone-700 hover:bg-stone-200">
            The five books
          </a>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {s === "torah" && <TorahTeamim />}

        <section id="books" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">{s === "torah" ? "The five books" : "Books"}</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {books.map(({ book, lessons }) => (
              <li key={book.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <div className="flex items-baseline gap-3">
                    {s === "torah" ? (
                      <Link href={`/tanakh/torah/${book.id}/`} dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-900 hover:text-amber-800">
                        {book.he}
                      </Link>
                    ) : (
                      <span dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-900">
                        {book.he}
                      </span>
                    )}
                    <span className="text-sm text-stone-500">{book.en}</span>
                  </div>
                  <div className="text-xs text-stone-400">{book.melody}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {s === "torah" && (
                    <Link
                      href={`/tanakh/torah/${book.id}/`}
                      className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-200"
                    >
                      {PARASHOT.filter((p) => p.book === book.id).length} parashiyot →
                    </Link>
                  )}
                  {lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/practice/${l.id}/`}
                      className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                    >
                      {l.title.en}
                    </Link>
                  ))}
                  {lessons.length === 0 && s !== "torah" && <span className="text-xs text-stone-400">Lessons coming soon</span>}
                  {s !== "torah" && (
                    <Link href={`/teamim/#${book.id}`} className="text-sm text-amber-800 hover:underline">
                      Te&apos;amim →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
