import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TANAKH } from "@/data/teamim-reference";
import { PARASHOT, type Aliyah } from "@/data/parashot";
import { curriculum } from "@/lib/curriculum/repository";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import type { Lesson } from "@/types/curriculum";
import { BookChapters } from "@/components/tanakh/BookChapters";



/** Every book has a page: parashiyot for the Torah, chapters for Nevi'im and Ketuvim. */
export function generateStaticParams() {
  return TANAKH.map((b) => ({ section: b.section, book: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }): Promise<Metadata> {
  const { book } = await params;
  const b = TANAKH.find((x) => x.id === book);
  return { title: b ? `${b.en} · Keriah Trainer` : "Keriah Trainer" };
}

/** "3:12" → comparable number. */
const pos = (cv: string) => {
  const [c, v] = cv.split(":").map(Number);
  return c * 1000 + v;
};
const fmt = (a: { from: string; to: string }) => `${a.from} – ${a.to}`;

/** Practice lessons whose pasuk falls inside an aliyah. */
function lessonsIn(lessons: Lesson[], a: Aliyah): Lesson[] {
  return lessons.filter((l) => {
    const cv = l.citation.ref.split(" ").pop() ?? "";
    return pos(cv) >= pos(a.from) && pos(cv) <= pos(a.to);
  });
}

export default async function BookPage({ params }: { params: Promise<{ section: string; book: string }> }) {
  const { section, book: bookId } = await params;
  const book = TANAKH.find((b) => b.id === bookId && b.section === section);
  if (!book) notFound();
  if (section !== "torah") return <BookChapters book={book} />;
  const parashot = PARASHOT.filter((p) => p.book === book.id);

  let lessons: Lesson[] = [];
  if (book.courseId) {
    const units = await curriculum.listUnits(book.courseId);
    lessons = (await Promise.all(units.map((u) => curriculum.listLessons(u.id)))).flat();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/#tanakh" className="hover:underline">
          Tanakh
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/" className="hover:underline">
          Torah
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
        {parashot.length} parashiyot, each divided into its 7 aliyot and Maftir.
      </p>

      <nav aria-label="Parashiyot">
        <ol className="mt-4 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {parashot.map((p) => (
            <li key={p.id}>
              <Link
                href={`/tanakh/torah/${book.id}/${p.id}/`}
                className="flex items-baseline justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-stone-200 transition-colors hover:bg-amber-50 hover:ring-amber-300"
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
        <p className="mt-2 text-xs text-stone-500">Click a parasha to read its full text. Its aliyot are listed below.</p>
      </nav>

      <div className="mt-5 space-y-4">
        {parashot.map((p) => {
          const main = p.aliyot.filter((a) => a.n !== "M");
          const whole = { from: main[0].from, to: main[main.length - 1].to };
          return (
            <section
              key={p.id}
              id={p.id}
              className="scroll-mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-xs tabular-nums text-stone-400">#{p.num}</span>
                  <h2 className="text-xl font-semibold text-stone-900">
                    <Link href={`/tanakh/torah/${book.id}/${p.id}/`} className="hover:text-amber-800 hover:underline">
                      {p.en}
                    </Link>
                  </h2>
                  <span className="text-sm tabular-nums text-stone-500">{fmt(whole)}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <Link
                    href={`/tanakh/torah/${book.id}/${p.id}/`}
                    className="rounded-lg bg-amber-700 px-3 py-1 text-sm font-medium text-white hover:bg-amber-800"
                  >
                    Read the text →
                  </Link>
                  <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
                    {p.he}
                  </span>
                </div>
              </div>

              <table className="mt-3 w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-400">
                    <th className="w-40 py-1.5 pe-3 font-medium sm:w-48">Aliyah</th>
                    <th className="w-36 py-1.5 pe-3 font-medium sm:w-56">Pesukim</th>
                    <th className="py-1.5 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {p.aliyot.map((a) => {
                    const name = ALIYAH_NAMES[String(a.n)];
                    const here = lessonsIn(lessons, a);
                    return (
                      <tr key={String(a.n)} className={`border-b border-stone-100 last:border-0 ${a.n === "M" ? "text-stone-500" : ""}`}>
                        <td className="py-2 pe-3">
                          <Link
                            href={`/tanakh/torah/${book.id}/${p.id}/#${a.n === "M" ? "aliyah-7" : `aliyah-${a.n}`}`}
                            className="font-medium text-stone-800 hover:text-amber-800 hover:underline"
                          >
                            {name.en}
                          </Link>
                          <span dir="rtl" lang="he" className="ml-2 font-hebrew text-stone-500">
                            {name.he}
                          </span>
                        </td>
                        <td className="py-2 pe-3 tabular-nums">
                          {fmt(a)} <span className="text-xs text-stone-400">({a.pesukim})</span>
                          {a.alt && <div className="text-xs text-stone-400">{a.alt}</div>}
                        </td>
                        <td className="py-2 text-end">
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {p.haftarah && <p className="mt-2 text-xs text-stone-500">Haftarah (Sephardic): {p.haftarah}</p>}
            </section>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-stone-400">
        Aliyot follow the common division (Hebcal). Where communities differ, it&apos;s noted under the aliyah.
      </p>
    </main>
  );
}
