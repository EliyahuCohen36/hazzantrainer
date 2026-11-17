import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TANAKH } from "@/data/teamim-reference";
import { PARASHOT } from "@/data/parashot";
import { versesBetween } from "@/data/torah";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import { curriculum } from "@/lib/curriculum/repository";
import { TorahText, type AliyahSection } from "@/components/tanakh/TorahText";
import { scrollColumnsFor } from "@/lib/torah/scroll-pages";
import { allChapters, partName, versesRange } from "@/data/tanakh";
import { PART_NAMES } from "@/data/tanakh-chapters";
import { PARASHA_EXTRA } from "@/data/parasha-extra";
import { ChapterView } from "@/components/tanakh/ChapterView";
import { aliyahRecording } from "@/data/tanakh-recordings";

export function generateStaticParams() {
  return [
    ...PARASHOT.map((p) => ({ section: "torah", book: p.book, parasha: p.id })),
    // Nevi'im and Ketuvim: one page per chapter.
    ...TANAKH.filter((b) => b.section !== "torah").flatMap((b) =>
      allChapters(b.id).map((c) => ({ section: b.section, book: b.id, parasha: c.slug })),
    ),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ section: string; book: string; parasha: string }> }): Promise<Metadata> {
  const { section, book, parasha } = await params;
  if (section !== "torah") {
    const b = TANAKH.find((x) => x.id === book);
    const ref = allChapters(book).find((c) => c.slug === parasha);
    const name = ref ? (partName(book, ref.part)?.en ?? b?.en) : b?.en;
    return { title: ref ? `${name} ${ref.c} · Kriah Trainer` : "Kriah Trainer" };
  }
  const p = PARASHOT.find((x) => x.id === parasha);
  return { title: p ? `Parashat ${p.en} · Kriah Trainer` : "Kriah Trainer" };
}

export default async function ParashaPage({ params }: { params: Promise<{ section: string; book: string; parasha: string }> }) {
  const { section, book: bookId, parasha: parashaId } = await params;
  const book = TANAKH.find((b) => b.id === bookId && b.section === section);
  if (book && section !== "torah") return <ChapterView book={book} slug={parashaId} />;
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
      recording: aliyahRecording(p.book, p.id, a.n as number),
      maftirRecording: maftir && a.n === 7 ? aliyahRecording(p.book, p.id, "M") : undefined,
    };
  });

  // The parasha as it stands in the Sefer Torah (Torah Scroll Mode).
  const scrollColumns = scrollColumnsFor(p.book, main[0].from, main[main.length - 1].to);

  // Weekday reading (Monday, Thursday, Shabbat Minha) and the haftarah.
  const extra = PARASHA_EXTRA[p.num];
  const WEEKDAY = [
    { en: "Kohen", he: "כהן" },
    { en: "Levi", he: "לוי" },
    { en: "Yisrael", he: "ישראל" },
  ];
  const weekdaySections: AliyahSection[] = (extra?.weekday ?? []).map((r, i) => ({
    id: `weekday-${i + 1}`,
    en: WEEKDAY[i].en,
    he: WEEKDAY[i].he,
    range: `${r.from} – ${r.to}`,
    verses: versesBetween(p.book, r.from, r.to),
  }));
  const hParts = extra?.syrian ?? [];
  const haftarahVerses = hParts.flatMap((h) => versesRange(h.book, h.part, h.from, h.to));
  const hName = (h: (typeof hParts)[number]) => {
    const b = TANAKH.find((x) => x.id === h.book);
    return `${PART_NAMES[h.book]?.find((x) => x.slug === h.part)?.en ?? b?.en} ${h.from}–${h.to}`;
  };
  const haftarah: AliyahSection | undefined = haftarahVerses.length
    ? {
        id: "haftarah",
        en: "Haftarah",
        he: "הפטרה",
        range: hParts.map(hName).join(", "),
        verses: haftarahVerses,
        recording: aliyahRecording(p.book, p.id, "H"),
      }
    : undefined;
  const nav = {
    shabbat: [
      ...main.map((a) => ({ id: `aliyah-${a.n}`, label: ALIYAH_NAMES[String(a.n)].en, from: a.from, to: a.to })),
      ...(maftir ? [{ id: "maftir", label: "Maftir", from: maftir.from, to: maftir.to }] : []),
      ...(haftarah ? [{ id: "haftarah", label: "Haftarah" }] : []),
    ],
    weekday: extra?.weekday?.map((r, i) => ({ id: `weekday-${i + 1}`, label: WEEKDAY[i].en, from: r.from, to: r.to })),
  };

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
        {haftarah && <span className="text-stone-400"> · Haftarah: {haftarah.range}</span>}
      </p>


      <div className="mt-4">
        <TorahText
          sections={sections}
          practice={practice}
          scrollColumns={scrollColumns}
          nav={nav}
          weekdaySections={weekdaySections}
          haftarah={haftarah}
          title={p.en}
        />
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
