import type { Metadata } from "next";
import Link from "next/link";
import { PARASHOT } from "@/data/parashot";
import { TANAKH } from "@/data/teamim-reference";
import { TorahTabs } from "@/components/tanakh/TorahTabs";

export const metadata: Metadata = { title: "Shnayim Mikra ve-Ehad Targum · Keriah Trainer" };

export function generateStaticParams() {
  return [{ section: "torah" }];
}

/** Shnayim Mikra ve-Ehad Targum: why, how, and every parasha. */
export default function ShnayimMikraPage() {
  const books = TANAKH.filter((b) => b.section === "torah");
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">
          Keriah Trainer
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tanakh/torah/" className="hover:underline">
          Torah
        </Link>
        <span className="mx-1.5">/</span>
        Shnayim Mikra ve-Ehad Targum
      </nav>
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-900">Torah</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-stone-700">
          תורה
        </span>
      </div>
      <TorahTabs current="shnayim" />

      <section className="mt-5 space-y-3 rounded-2xl border border-stone-200 bg-white p-5 text-stone-800 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-stone-900">A great mitzvah, every week</h2>
          <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            שנים מקרא ואחד תרגום
          </span>
        </div>
        <p>
          The Gemara (Berakhot 8a) tells us that Rabbi Yehoshua ben Levi taught his sons: complete the parashiyot together
          with the community, twice the Mikra and once the Targum, and whoever does this, his days and years are
          lengthened.
        </p>
        <p>
          Every week, each of us reads the parasha of that week on our own: each pasuk twice in the Hebrew, and once in
          the Targum of Onkelos, the Aramaic translation. It is a mitzvah even for someone who hears the whole Torah
          reading in the synagogue (Shulchan Arukh, Orah Hayyim 285:1). It keeps us close to the Torah all year, so that
          we finish it together with the whole community.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 text-stone-800 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">The halakhot in short</h2>
        <ul className="mt-2 list-disc space-y-2 ps-5">
          <li>Read the parasha of the week: the Mikra twice and the Targum once (Shulchan Arukh 285:1).</li>
          <li>
            The time: from the start of the week (Sunday; some begin already after Minha on the Shabbat before). Best is to
            finish before the meal on Shabbat day. If not, until Minha; afterwards, until Wednesday; and, at the very
            latest, until Simhat Torah (Shulchan Arukh 285).
          </li>
          <li>
            Rashi&apos;s commentary can take the place of the Targum, and someone who is careful reads both the Targum and
            Rashi (Shulchan Arukh 285:2).
          </li>
          <li>A pasuk that has no Targum is read three times in Hebrew.</li>
          <li>After reading the parasha, there is a halakha to read the haftarah of the week once. It is shown after each parasha here.</li>
          <li>
            Many Sephardim follow the Arizal (brought in Kaf HaHayyim 285): read on Friday, in the daytime, and not the
            Targum at night; and try to read without interruption.
          </li>
          <li>On this site each pasuk is written twice, with its te&apos;amim, followed by the Targum, so you can read it in order.</li>
        </ul>
        <p className="mt-3 text-sm text-stone-500">
          This is a short summary. For your own practice, ask your Rav.
        </p>
      </section>

      <div className="mt-5 space-y-5">
        {books.map((b) => (
          <section key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold text-stone-900">{b.en}</h2>
              <span dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-800">
                {b.he}
              </span>
            </div>
            <ol className="mt-3 flex flex-wrap gap-2">
              {PARASHOT.filter((p) => p.book === b.id).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tanakh/torah/shnayim-mikra/${p.id}/`}
                    className="flex items-baseline gap-2 rounded-lg px-3 py-1.5 ring-1 ring-stone-200 hover:bg-amber-50"
                  >
                    <span className="text-sm font-medium text-stone-900">{p.en}</span>
                    <span dir="rtl" lang="he" className="font-hebrew text-stone-600">
                      {p.he}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-stone-400">
        Mikra: Miqra According to the Masorah. Targum Onkelos vocalized according to the Yemenite Taj. Both from Hebrew
        Wikisource (CC BY-SA 4.0).
      </p>
    </main>
  );
}
