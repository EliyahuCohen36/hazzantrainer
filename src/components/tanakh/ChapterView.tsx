import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTION_TITLES, type TanakhBook } from "@/data/teamim-reference";
import { allChapters, chapterVerses, MEGILLOT, partName } from "@/data/tanakh";
import { TorahText, type AliyahSection } from "./TorahText";
import { chapterRecording } from "@/data/tanakh-recordings";

const HEB_NUM = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const HEB_TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
/** 1 → א, 15 → טו, 119 → קיט */
function hebNum(n: number): string {
  let out = "";
  if (n >= 100) {
    out += "ק";
    n -= 100;
  }
  if (n === 15) return out + "טו";
  if (n === 16) return out + "טז";
  return out + HEB_TENS[Math.floor(n / 10)] + HEB_NUM[n % 10];
}

/** One chapter of a Nevi'im or Ketuvim book. */
export function ChapterView({ book, slug }: { book: TanakhBook; slug: string }) {
  const chapters = allChapters(book.id);
  const i = chapters.findIndex((c) => c.slug === slug);
  if (i < 0) notFound();
  const ref = chapters[i];
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  const part = partName(book.id, ref.part);
  const name = part?.en ?? book.en;
  const he = part?.he ?? book.he;
  const label = (c: typeof ref) => `${partName(book.id, c.part)?.en ?? book.en} ${c.c}`;
  const verses = chapterVerses(book.id, ref);
  const sections: AliyahSection[] = [
    {
      id: "text",
      en: `${name} ${ref.c}`,
      he: `${he} ${hebNum(ref.c)}`,
      range: `${ref.verses} pesukim`,
      verses,
      recording: chapterRecording(book.id, ref.slug),
    },
  ];
  const megillah = MEGILLOT.has(book.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/tanakh/${book.section}/`} className="hover:underline">
          {SECTION_TITLES[book.section].en}
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/tanakh/${book.section}/${book.id}/`} className="hover:underline">
          {book.en}
        </Link>
        <span className="mx-1.5">/</span>
        {ref.c}
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">
          {name} {ref.c}
        </h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-amber-800">
          {he} {hebNum(ref.c)}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {book.melody}
        {verses.some((v) => v.e) && <span className="text-stone-400"> · Ta&apos;amei Emet</span>}
      </p>

      <div className="mt-4">
        <TorahText sections={sections} practice={{}} allowScroll={megillah} scrollLabel="Megillah Scroll Mode" title={book.en} book={book.id} />
      </div>

      <div className="mt-6 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/tanakh/${book.section}/${book.id}/${prev.slug}/`} className="text-amber-800 hover:underline">
            ← {label(prev)}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tanakh/${book.section}/${book.id}/${next.slug}/`} className="text-amber-800 hover:underline">
            {label(next)} →
          </Link>
        )}
      </div>
      <p className="mt-6 text-xs text-stone-400">Text: Miqra According to the Masorah (Hebrew Wikisource, CC BY-SA 4.0).</p>
    </main>
  );
}
