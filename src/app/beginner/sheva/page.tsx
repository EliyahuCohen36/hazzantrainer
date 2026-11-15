import type { Metadata } from "next";
import Link from "next/link";
import { KHAF_SOFIT_SHEVA, LETTERS, SHEVA, SHEVA_LEVEL, withNekuda } from "@/data/beginner";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { Tile } from "@/components/beginner/Tile";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { WithMaamid } from "@/components/reader/Maamid";

export const metadata: Metadata = { title: "The Sheva · Beginner Keriah" };

/** Example words; the Sheva Na is drawn big and bold, as in the Torah text. */
const NA = [
  { word: "בְּנִי", why: "on the first letter of the word" },
  { word: "שְׁמַע", why: "on the first letter of the word" },
  { word: "שָׁמְרוּ", why: "after a Qamats" },
  { word: "תֵּלְכוּ", why: "after a Sere" },
  { word: "יִשְׁמְרוּ", why: "the second of two Shevas in a row" },
];
const NACH = [
  { word: "מַלְכָּה", why: "after a Patah" },
  { word: "יִשְׂרָאֵל", why: "after a Hireq (without Yod)" },
  { word: "מִדְבָּר", why: "after a Hireq (without Yod)" },
  { word: "לֶךְ", why: "at the end of the word" },
];

function Examples({ title, he, say, items, tone }: { title: string; he: string; say: string; items: typeof NA; tone: string }) {
  return (
    <section className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-semibold text-stone-900">{title}</h2>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          {he}
        </span>
      </div>
      <p className="mt-1 text-stone-700">{say}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x.word} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-2">
            <span className="text-sm text-stone-600">{x.why}</span>
            <span dir="rtl" lang="he" className="font-hebrew text-4xl text-stone-900">
              <WithMaamid text={x.word} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The Sheva: its own section, opened after all the letters and the other nekudot. */
export default function ShevaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <BeginnerNav here="The Sheva" />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">The Sheva</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          שְׁוָא נָע וּשְׁוָא נָח
        </span>
      </div>

      <BeginnerLock need={SHEVA_LEVEL}>
        <p className="mb-5 text-stone-600">
          The Sheva is two dots, one above the other, under a letter (בְ). Sometimes it says a short &ldquo;e&rdquo;:
          that is a <b>Sheva Na</b>. Sometimes it is silent: that is a <b>Sheva Nach</b>. In the Torah text on this site
          every Sheva Na is drawn <b>big and bold</b>, so you can see it.
        </p>

        <div className="grid gap-5">
          <Examples
            title={"Sheva Na: say a short \u201ce\u201d"}
            he="שְׁוָא נָע"
            say="A Sheva is Na on the first letter of a word, on a letter with a dagesh, after a Qamats, Sere, Hireq with Yod, Holem, or a Shuruq in the middle of a word, and when it is the second of two Shevas in a row."
            items={NA}
            tone="border-amber-200 bg-amber-50"
          />
          <Examples
            title="Sheva Nach: silent"
            he="שְׁוָא נָח"
            say="A Sheva is Nach at the end of a word, and after a Patah, Segol, Hireq (without Yod), Qamats Qatan, Qibbus, or a Shuruq at the start of a word (וּ)."
            items={NACH}
            tone="border-sky-200 bg-sky-50"
          />
        </div>

        <h2 className="mt-10 mb-1 text-2xl font-semibold text-stone-900">Every letter with a Sheva</h2>
        <p className="mb-4 text-stone-600">
          Alef, He, Het and Ayin don&apos;t take a Sheva: they take a Hataf instead.
        </p>
        <div className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
          <SpeedControl compact />
        </div>
        <div dir="rtl" className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
          {LETTERS.map((l) => {
            const g = withNekuda(l, SHEVA);
            return g ? <Tile key={l.id} glyph={g} label={`${l.sym}'`} sub={l.name} rec={`sound:${l.id}:sheva`} /> : null;
          })}
          <Tile glyph={KHAF_SOFIT_SHEVA.text} label={KHAF_SOFIT_SHEVA.sound} sub="Khaf Sofit" color="amber" rec="sound:khaf-sofit:sheva" />
        </div>
      </BeginnerLock>

      <div className="mt-10 flex justify-start">
        <Link href="/beginner/chart/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
          ← Letters with Nekudot
        </Link>
      </div>
    </main>
  );
}
