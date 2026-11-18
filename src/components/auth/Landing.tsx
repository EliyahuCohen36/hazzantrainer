import Link from "next/link";
import { asset } from "@/lib/base-path";
import { CONTACT_EMAIL } from "@/data/demo";
import { BEGINNER_FEATURES, INDIVIDUAL_PERIOD, INDIVIDUAL_PRICE, SCHOOL_FEATURES, TORAH_FEATURES, YEARLY_PRICE, YEARLY_SAVING } from "@/data/pricing";
import { ContactBox } from "@/components/ContactBox";

function Shot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-300/40 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt={alt} className="block w-full" loading="lazy" />
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 fill-amber-700" aria-hidden>
      <path d="M8.1 14.3 4 10.2l1.4-1.4 2.7 2.7 6.5-6.5L16 6.4z" />
    </svg>
  );
}

const BEGINNER_STEPS = [
  {
    title: "Start with the alef-bet",
    text: "Every letter with its name and its sound, in the Hazzan's voice. Tap a letter to hear it. The final letters sit beside their regular letters.",
    img: "/images/beginner-letters.webp",
    alt: "The alef-bet: big letter tiles with each letter's name and sound",
  },
  {
    title: "Then every letter with every nekuda",
    text: "Qamats, Sere, Hireq, Holem, Shuruq and the rest, each on every letter, read the Syrian way. Teachers open one nekuda at a time.",
    img: "/images/beginner-nekuda.webp",
    alt: "Every letter with a Qamats: ba, ga, da and so on",
  },
  {
    title: "Read real words, one sound at a time",
    text: "Words from the Torah with only the nekudot learned so far: first one sound, then the next, then both together. Listen and pick the word, or read aloud, and earn stars.",
    img: "/images/beginner-words.webp",
    alt: "Practice words: listen to the Hazzan and pick the word you heard",
  },
];

const STEPS = [
  {
    title: "Learn the te'amim step by step",
    text: "Eight levels, easiest first, starting with Ma'arikh Tarha. Each ta'am has its Syrian name, examples from the Torah, and the Hazzan's own recording.",
    img: "/images/teamim-levels.webp",
    alt: "The te'amim trainer: Level 1, Ma'arikh Tarha, with recordings and Torah examples",
  },
  {
    title: "Read the parasha with every ta'am named",
    text: "The whole Torah with nikkud and te'amim. Turn on the names to see each ta'am under its word. The ma'amid, qamats katan and sheva na are marked clearly.",
    img: "/images/taam-names.webp",
    alt: "Bereshit with the name of each ta'am under its word",
  },
  {
    title: "Practice from a real Sefer Torah page",
    text: "Torah Scroll Mode shows each column of the scroll line for line, in Sephardic scroll letters with their crowns, with the vowelled column beside it like a tikkun.",
    img: "/images/tikkun.webp",
    alt: "Column 1 of the Sefer Torah beside the same column with vowels",
  },
];

/** The two halves of the subscription, side by side (also on the sign-in page). */
export function FeatureColumns({ compact = false }: { compact?: boolean }) {
  const cols = [
    { title: "Beginner Keriah", he: "קְרִיאָה לְמַתְחִילִים", text: "Learn to read Hebrew in the Syrian tradition", items: BEGINNER_FEATURES },
    { title: "Torah reading", he: "טַעֲמֵי הַמִּקְרָא", text: "Read the Torah with the te'amim", items: TORAH_FEATURES },
  ];
  return (
    <div className={`grid gap-5 ${compact ? "mt-4" : "mt-10 md:grid-cols-2"}`}>
      {cols.map((c) => (
        <div key={c.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold text-stone-900">{c.title}</h3>
            <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
              {c.he}
            </span>
          </div>
          <p className="text-sm text-stone-500">{c.text}</p>
          <ul className="mt-4 space-y-2 text-sm text-stone-700">
            {c.items.map((f) => (
              <li key={f} className="flex gap-2">
                <Check />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** What visitors who aren't signed in see on the home page. */
export function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-[#faf8f5] to-[#faf8f5]">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
              קְרִיאָה וְטַעֲמֵי הַמִּקְרָא · מִנְהַג אֲרַם צוֹבָא
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">
              Learn to read Hebrew and the Torah in the Syrian tradition
            </h1>
            <p className="mt-4 text-lg text-stone-700">
              From a child&apos;s very first letter to reading the parasha with te&apos;amim, all in the Hazzan&apos;s own voice.
              Children listen, read and sing it back, and get stars every time they practice, one level at a time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/subscribe/"
                className="rounded-xl bg-amber-700 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-amber-700/20 hover:bg-amber-800"
              >
                Start for {INDIVIDUAL_PRICE}/{INDIVIDUAL_PERIOD}
              </Link>
              <Link
                href="/demo/"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3 text-base font-semibold text-stone-800 hover:bg-stone-50"
              >
                Try the free demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              Already have an account?{" "}
              <Link href="/login/" className="font-medium text-amber-800 underline">
                Sign in
              </Link>
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-amber-200/30 blur-2xl" aria-hidden />
            <Shot src="/images/shirat-hayam.webp" alt="Shirat HaYam in Torah Scroll Mode, beside the same lines with vowels like a tikkun" />
          </div>
        </div>
      </section>

      {/* Beginner Keriah */}
      <section className="mx-auto max-w-5xl space-y-16 px-4 pt-16">
        <div className="text-center">
          <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            קְרִיאָה לְמַתְחִילִים
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-stone-900">Beginner Keriah: learn to read Hebrew</h2>
          <p className="mx-auto mt-2 max-w-2xl text-stone-600">
            For kindergarten and first-time readers. The letters, then the nekudot, then real words, in the Syrian
            pronunciation.
          </p>
        </div>
        {BEGINNER_STEPS.map((s, i) => (
          <div key={s.title} className="grid items-center gap-8 md:grid-cols-2">
            <div className={i % 2 ? "md:order-2" : ""}>
              <span className="text-sm font-semibold uppercase tracking-wide text-amber-700">Step {i + 1}</span>
              <h3 className="mt-1 text-2xl font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-3 text-stone-700">{s.text}</p>
            </div>
            <Shot src={s.img} alt={s.alt} className={i % 2 ? "md:order-1" : ""} />
          </div>
        ))}
      </section>

      {/* Torah reading */}
      <section className="mx-auto max-w-5xl space-y-16 px-4 py-16">
        <div className="border-t border-stone-200 pt-16 text-center">
          <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            טַעֲמֵי הַמִּקְרָא
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-stone-900">Torah reading with the te&apos;amim</h2>
          <p className="mx-auto mt-2 max-w-2xl text-stone-600">
            When they can read, they learn to read the Torah: the te&apos;amim, the parasha and the Sefer Torah itself.
          </p>
        </div>
        {STEPS.map((s, i) => (
          <div key={s.title} className="grid items-center gap-8 md:grid-cols-2">
            <div className={i % 2 ? "md:order-2" : ""}>
              <span className="text-sm font-semibold uppercase tracking-wide text-amber-700">Step {i + 1}</span>
              <h3 className="mt-1 text-2xl font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-3 text-stone-700">{s.text}</p>
            </div>
            <Shot src={s.img} alt={s.alt} className={i % 2 ? "md:order-1" : ""} />
          </div>
        ))}
        <div className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          {[
            ["🎤", "Sing and get stars", "Press Practice, sing the ta'am, and the trainer compares it with the Hazzan."],
            ["🐢", "Slow it down", "Any speed from 0.25× to 3×. The tune stays the same."],
            ["🧑‍🏫", "Made for schools", "Teachers open levels for their class and see every child's progress."],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-2 font-semibold text-stone-900">{title}</h3>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Everything in a subscription */}
      <section className="border-t border-stone-200 bg-amber-50/60 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-semibold text-stone-900">Everything in one subscription</h2>
          <p className="mt-2 text-center text-stone-600">
            One subscription ({INDIVIDUAL_PRICE}/{INDIVIDUAL_PERIOD} or {YEARLY_PRICE}/year) opens all of it, from the first letter to the whole Torah.
          </p>
          <FeatureColumns />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-semibold text-stone-900">Choose your plan</h2>
          <p className="mt-2 text-center text-stone-600">Try the demo for free. No commitment: cancel any time.</p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="relative rounded-2xl border-2 border-amber-600 bg-white p-7 shadow-lg">
              <span className="absolute -top-3 left-6 rounded-full bg-amber-700 px-3 py-0.5 text-xs font-semibold text-white">
                For families
              </span>
              <h3 className="text-lg font-semibold text-stone-900">Individual</h3>
              <p className="mt-2">
                <span className="text-4xl font-semibold text-stone-900">{INDIVIDUAL_PRICE}</span>
                <span className="text-stone-500"> / {INDIVIDUAL_PERIOD}</span>
              </p>
              <p className="mt-1 text-sm text-stone-700">
                or <b>{YEARLY_PRICE} a year</b> <span className="text-emerald-700">({YEARLY_SAVING})</span>
              </p>
              <p className="mt-5 text-sm font-semibold text-stone-900">Beginner Keriah</p>
              <ul className="mt-2 space-y-2 text-sm text-stone-700">
                {BEGINNER_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold text-stone-900">Torah reading</p>
              <ul className="mt-2 space-y-2 text-sm text-stone-700">
                {TORAH_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/subscribe/"
                className="mt-7 block rounded-xl bg-amber-700 px-5 py-3 text-center font-semibold text-white hover:bg-amber-800"
              >
                Subscribe
              </Link>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-7">
              <h3 className="text-lg font-semibold text-stone-900">Schools</h3>
              <p className="mt-2">
                <span className="text-4xl font-semibold text-stone-900">Per student</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-stone-700">
                {SCHOOL_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Keriah%20Trainer%20for%20our%20school`}
                  className="mt-7 block rounded-xl border border-stone-300 bg-white px-5 py-3 text-center font-semibold text-stone-800 hover:bg-stone-100"
                >
                  Bring it to your school
                </a>
              ) : (
                <p className="mt-7 rounded-xl border border-stone-200 bg-white px-5 py-3 text-center text-sm text-stone-600">
                  Ask your school about Keriah Trainer. Students sign up with the code from their teacher.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-2xl px-4">
          <ContactBox />
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <Link href="/about/" className="hover:underline">
          About Keriah Trainer
        </Link>
        <span className="mx-2">·</span>
        <Link href="/demo/" className="hover:underline">
          Free demo
        </Link>
        <span className="mx-2">·</span>
        <Link href="/login/" className="hover:underline">
          Sign in
        </Link>
      </footer>
    </main>
  );
}
