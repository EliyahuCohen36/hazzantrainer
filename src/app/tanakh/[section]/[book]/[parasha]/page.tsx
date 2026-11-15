import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TANAKH } from "@/data/teamim-reference";
import { PARASHOT } from "@/data/parashot";
import { versesBetween } from "@/data/torah";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import { curriculum } from "@/lib/curriculum/repository";
import { TorahText, type AliyahSection } from "@/components/tanakh/TorahText";

export function generateStaticParams() {
  return PARASHOT.map((p) => ({ section: "torah", book: p.book, parasha: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ parasha: string }> }): Promise<Metadata> {
  const { parasha } = await params;
  const p = PARASHOT.find((x) => x.id === parasha);
  return { title: p ? `Parashat ${p.en} · Kriah Trainer` : "Kriah Trainer" };
}

export default async function ParashaPage({ params }: { params: Promise<{ section: string; book: string; parasha: string }> }) {
  const { section, book: bookId, parasha: parashaId } = await params;
  const book = TANAKH.find((b) => b.id === bookId && b.section === section);
  const idx = PARASHOT.findIndex((x) => x.id === parashaId && x.book === bookId);
  if (!book || idx < 0) notFound();
  const p = PARASHOT[idx];
  const prev = PARASHOT[idx - 1];
  const next = PARASHOT[idx + 1];

  const maftir = p.aliyot.find((a) => a.n === "M");
  const main = p.aliyot.filter((a) => a.n !== "M");
  const sections: AliyahSection[] = main.map((a) => {
    const verses = versesBetween(p.book, a.from, a.to);
    const keys = verses.map((v) => `${v.c}:${v.v}`);
    return {
      id: `aliyah-${a.n}`,
      en: ALIYAH_NAMES[String(a.n)].en,
      he: ALIYAH_NAMES[String(a.n)].he,
      range: `${a.from} – ${a.to}`,
      verses,
      maftirFrom: maftir && keys.includes(maftir.from) ? maftir.from : undefined,
    };
  });

  // Pesukim that have a trainer lesson.
  const practice: Record<string, string> = {};
  if (book.courseId) {
    const units = await curriculum.listUnits(book.courseId);
    for (const l of (await Promise.all(units.map((u) => curriculum.listLessons(u.id)))).flat()) {
      practice[l.citation.ref.split(" ").pop() ?? ""] = `/practice/${l.id}/`;
    }
  }

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
        <Link href={`/tanakh/torah/${book.id}/`} className="hover:underline">
          {book.en}
        </Link>
        <span className="mx-1.5">/</span>
        {p.en}
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">Parashat {p.en}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-amber-800">
          {p.he}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {book.en} {main[0].from} – {main[main.length - 1].to}
        {p.haftarah && <span className="text-stone-400"> · Haftarah (Sephardic): {p.haftarah}</span>}
      </p>

      <nav aria-label="Aliyot" className="mt-3 flex flex-wrap gap-1.5 text-sm">
        {main.map((a) => (
          <a
            key={String(a.n)}
            href={`#aliyah-${a.n}`}
            className="rounded-full bg-white px-3 py-1 text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-amber-50"
          >
            {ALIYAH_NAMES[String(a.n)].en}
          </a>
        ))}
      </nav>

      <div className="mt-4">
        <TorahText sections={sections} practice={practice} />
      </div>

      <div className="mt-6 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/tanakh/torah/${prev.book}/${prev.id}/`} className="text-amber-800 hover:underline">
            ← {prev.en}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tanakh/torah/${next.book}/${next.id}/`} className="text-amber-800 hover:underline">
            {next.en} →
          </Link>
        )}
      </div>

      <p className="mt-6 text-xs text-stone-400">
        Text: Miqra According to the Masorah (Hebrew Wikisource, CC BY-SA 4.0), with Sephardic Torah scroll spellings where
        they differ. Ten Commandments shown with the ta&apos;am tahton.
      </p>
    </main>
  );
}
