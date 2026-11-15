import Link from "next/link";
import { asset } from "@/lib/base-path";
import { CONTACT_EMAIL } from "@/data/demo";
import { INDIVIDUAL_FEATURES, INDIVIDUAL_PERIOD, INDIVIDUAL_PRICE, SCHOOL_FEATURES } from "@/data/pricing";

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
    title: "Practise from a real Sefer Torah page",
    text: "Torah Scroll Mode shows each column of the scroll line for line, in Sephardic scroll letters with their crowns, with the vowelled column beside it like a tikkun.",
    img: "/images/tikkun.webp",
    alt: "Column 1 of the Sefer Torah beside the same column with vowels",
  },
];

/** What visitors who aren't signed in see on the home page. */
export function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-[#faf8f5] to-[#faf8f5]">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-12 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
              טעמי המקרא · מנהג ארם צובא
            </p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">
              Learn to read the Torah in the Syrian tradition
            </h1>
            <p className="mt-4 text-lg text-stone-700">
              Kriah Trainer teaches children the te&apos;amim with the Hazzan&apos;s own voice. They listen, sing it back, and
              get stars every time they practise, one level at a time.
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

      {/* How it works */}
      <section className="mx-auto max-w-5xl space-y-16 px-4 py-16">
        {STEPS.map((s, i) => (
          <div key={s.title} className="grid items-center gap-8 md:grid-cols-2">
            <div className={i % 2 ? "md:order-2" : ""}>
              <span className="text-sm font-semibold uppercase tracking-wide text-amber-700">Step {i + 1}</span>
              <h2 className="mt-1 text-2xl font-semibold text-stone-900">{s.title}</h2>
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
              <ul className="mt-5 space-y-2 text-sm text-stone-700">
                {INDIVIDUAL_FEATURES.map((f) => (
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
                  href={`mailto:${CONTACT_EMAIL}?subject=Kriah%20Trainer%20for%20our%20school`}
                  className="mt-7 block rounded-xl border border-stone-300 bg-white px-5 py-3 text-center font-semibold text-stone-800 hover:bg-stone-100"
                >
                  Bring it to your school
                </a>
              ) : (
                <p className="mt-7 rounded-xl border border-stone-200 bg-white px-5 py-3 text-center text-sm text-stone-600">
                  Ask your school about Kriah Trainer. Students sign up with the code from their teacher.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <Link href="/about/" className="hover:underline">
          About Kriah Trainer
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
