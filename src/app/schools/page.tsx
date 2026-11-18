import type { Metadata } from "next";
import Link from "next/link";
import { ContactBox } from "@/components/ContactBox";
import { CONTACT_EMAIL } from "@/data/demo";

export const metadata: Metadata = {
  title: "For schools · Keriah Trainer",
  description: "Why a school would teach Hebrew reading and te'amim with Keriah Trainer instead of textbooks.",
};

const REASONS: { emoji: string; title: string; text: string }[] = [
  {
    emoji: "🎧",
    title: "Every child hears the right sound, every time",
    text: "A textbook can't speak. Here every letter, nekuda, word and ta'am is in the Hazzan's own voice, in the Syrian tradition, so children practice with the right pronunciation at home as well as in class.",
  },
  {
    emoji: "🪜",
    title: "One step at a time, in the right order",
    text: "Letters one by one (with drawing, and look-alike letters taught side by side), then the nekudot, real Torah words, the Sheva, Qamats Katan, Patah Genuva, Dagesh and the four kinds of He, then the te'amim one ta'am at a time. A child can't skip ahead: each step opens only after the one before is done.",
  },
  {
    emoji: "🧑‍🏫",
    title: "The teacher decides what's open",
    text: "Teachers open the letters, levels and steps for their class (or for one child), and choose which parts of the site the class can use at all: Beginner Keriah, te'amim, Torah reading, Shnayim Mikra, Siddur. Children only see what they are learning in class.",
  },
  {
    emoji: "✅",
    title: "Grading is done for you",
    text: "Every answer is checked as the child works. The teacher's page shows each child's progress, what they need to practice, and a grade, ready to download as a spreadsheet. No worksheets to collect and mark.",
  },
  {
    emoji: "💸",
    title: "Saves money on books",
    text: "One licence per student replaces readers, workbooks and te'amim booklets that wear out and need replacing every year. The full Tanakh, the Siddur and Shnayim Mikra are included.",
  },
  {
    emoji: "🔐",
    title: "Easy for the IT department",
    text: "Students can sign in with their school Google accounts: give us the school's email domain and they join the school by themselves; teachers then put them into classes. Every school and every class has its own code, which you can change at any time.",
  },
];

/** For schools: why use Keriah Trainer instead of textbooks (open to everyone). */
export default function SchoolsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <p dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
        קְרִיאָה וְטַעֲמֵי הַמִּקְרָא לְבָתֵּי סֵפֶר
      </p>
      <h1 className="mt-1 text-3xl font-semibold text-stone-900 sm:text-4xl">Keriah Trainer for schools</h1>
      <p className="mt-3 max-w-3xl text-lg text-stone-700">
        Teach Hebrew reading and Torah reading in the Syrian tradition with a program that speaks, follows a clear sequence,
        keeps every child at the right level and grades their work automatically.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {REASONS.map((r) => (
          <li key={r.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <span className="text-3xl" aria-hidden>
              {r.emoji}
            </span>
            <h2 className="mt-2 text-lg font-semibold text-stone-900">{r.title}</h2>
            <p className="mt-1 text-stone-700">{r.text}</p>
          </li>
        ))}
      </ul>
      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-semibold text-stone-900">How a school starts</h2>
        <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-stone-800">
          <li>We set up your school with the number of student places you need.</li>
          <li>Teachers join with the school code and make their classes. Each class gets its own code.</li>
          <li>Students join with their school Google account (or a username and the class code).</li>
          <li>Teachers open the first letters or levels, and the children start learning.</li>
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          {CONTACT_EMAIL && (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Keriah%20Trainer%20for%20our%20school`}
              className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800"
            >
              Contact us about your school
            </a>
          )}
          <Link href="/demo/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
            Try the free demo
          </Link>
        </div>
      </section>
      <div className="mt-10">
        <ContactBox />
      </div>
    </main>
  );
}
