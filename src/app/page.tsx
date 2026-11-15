import Link from "next/link";
import { SECTION_TITLES, TANAKH, type TanakhSection } from "@/data/teamim-reference";

const SECTIONS: Array<{ id: TanakhSection; blurb: string }> = [
  { id: "torah", blurb: "Names of the te'amim with recordings and examples, and practice by pasuk." },
  { id: "neviim", blurb: "Books of the Nevi'im and the Haftarah melody." },
  { id: "ketuvim", blurb: "Tehillim, the Megillot and the other books of Ketuvim." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-stone-900">Kriah Trainer</h1>
      <p className="mt-1 text-stone-600">Reading practice in the Syrian tradition.</p>

      <Link
        href="/beginner/"
        className="mt-8 flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 p-5 shadow-sm transition-colors hover:border-amber-400"
      >
        <span dir="rtl" lang="he" className="font-hebrew text-4xl text-amber-800">
          אבּג
        </span>
        <span className="flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold text-stone-900">Beginner Keriah</span>
            <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
              קְרִיאָה לְמַתְחִילִים
            </span>
          </span>
          <span className="mt-1 block text-sm text-stone-600">
            For first-time readers: the alef-bet with the final letters, then every letter with every nekuda.
          </span>
        </span>
      </Link>

      <section id="tanakh" className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-stone-900">Tanakh</h2>
          <span dir="rtl" lang="he" className="font-hebrew text-xl text-stone-600">
            תנ״ך
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {SECTIONS.map(({ id, blurb }) => (
            <Link
              key={id}
              href={`/tanakh/${id}/`}
              className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-semibold text-stone-900">{SECTION_TITLES[id].en}</span>
                <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
                  {SECTION_TITLES[id].he}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-600">{blurb}</p>
              <p dir="rtl" lang="he" className="mt-2 font-hebrew text-sm leading-relaxed text-stone-500">
                {TANAKH.filter((b) => b.section === id)
                  .map((b) => b.he)
                  .join(" · ")}
              </p>
            </Link>
          ))}
        </div>
        <Link href="/teamim/" className="mt-3 inline-block text-sm text-amber-800 hover:underline">
          Te&apos;amim of every book of Tanakh →
        </Link>
      </section>

      <section className="mt-8 rounded-2xl border border-dashed border-stone-300 p-5">
        <h2 className="text-lg font-semibold text-stone-700">Coming later</h2>
        <p className="mt-1 text-sm text-stone-500">Tefillah and Mishnah.</p>
      </section>
    </main>
  );
}
