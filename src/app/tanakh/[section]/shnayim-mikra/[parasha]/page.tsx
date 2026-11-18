import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PARASHOT } from "@/data/parashot";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import { TANAKH } from "@/data/teamim-reference";
import { versesBetween, type TorahVerse } from "@/data/torah";
import { ONKELOS } from "@/data/onkelos";
import { ShnayimText, type ShnayimSection } from "@/components/tanakh/ShnayimText";

export function generateStaticParams() {
  return PARASHOT.map((p) => ({ section: "torah", parasha: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ parasha: string }> }): Promise<Metadata> {
  const { parasha } = await params;
  const p = PARASHOT.find((x) => x.id === parasha);
  return { title: p ? `Shnayim Mikra: ${p.en} · Keriah Trainer` : "Keriah Trainer" };
}

/** The pasuk as read: the qere for ketiv/qere words, without the scroll's gap signs. */
function mikra(v: TorahVerse): string {
  return v.t
    .map((t) => (typeof t === "string" ? t : t.q))
    .filter((t) => !["_", "¶p", "¶s"].includes(t) && !t.startsWith("¶"))
    .join(" ")
    .replace(/\s*\|\s*/g, " ׀ ")
    .replace(/[{}[\]<>]/g, "");
}

export default async function ShnayimParashaPage({ params }: { params: Promise<{ parasha: string }> }) {
  const { parasha } = await params;
  const idx = PARASHOT.findIndex((x) => x.id === parasha);
  if (idx < 0) notFound();
  const p = PARASHOT[idx];
  const book = TANAKH.find((b) => b.id === p.book)!;
  const tg = ONKELOS[p.book] ?? {};
  const sections: ShnayimSection[] = p.aliyot
    .filter((a) => a.n !== "M")
    .map((a) => ({
      id: `aliyah-${a.n}`,
      en: ALIYAH_NAMES[String(a.n)].en,
      he: ALIYAH_NAMES[String(a.n)].he,
      verses: versesBetween(p.book, a.from, a.to).map((v) => ({
        ref: `${v.c}:${v.v}`,
        mikra: mikra(v),
        targum: tg[`${v.c}:${v.v}`] ?? "",
      })),
    }));
  const prev = PARASHOT[idx - 1];
  const next = PARASHOT[idx + 1];
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/tanakh/torah/" className="hover:underline">
          Torah
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/shnayim-mikra/" className="hover:underline">
          Shnayim Mikra ve-Ehad Targum
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
      <p className="mt-1 mb-4 text-sm text-stone-600">
        {book.en}: each pasuk twice, then the Targum.
      </p>
      <ShnayimText sections={sections} />
      <div className="mt-6 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link href={`/tanakh/torah/shnayim-mikra/${prev.id}/`} className="text-amber-800 hover:underline">
            ← {prev.en}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/tanakh/torah/shnayim-mikra/${next.id}/`} className="text-amber-800 hover:underline">
            {next.en} →
          </Link>
        )}
      </div>
      <p className="mt-6 text-xs text-stone-400">
        Mikra: Miqra According to the Masorah. Targum Onkelos vocalized according to the Yemenite Taj. Both from Hebrew
        Wikisource (CC BY-SA 4.0).
      </p>
    </main>
  );
}
