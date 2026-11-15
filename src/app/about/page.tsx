import type { Metadata } from "next";
import Link from "next/link";
import { asset } from "@/lib/base-path";

export const metadata: Metadata = { title: "About · Kriah Trainer" };

function Shot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg shadow-stone-300/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt={alt} className="block w-full" loading="lazy" />
    </figure>
  );
}

/** How the project started, what makes it different, and thanks. Open to everyone. */
export default function AboutPage() {
  return (
    <main>
      <section className="bg-gradient-to-b from-amber-50 to-[#faf8f5]">
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-10 text-center">
          <p dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            קריאת התורה · מנהג ארם צובא
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-900">About Kriah Trainer</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-700">
            A Torah reading trainer made in and for the Syrian community, so every child can learn to read the Torah the
            way it&apos;s read in our synagogues.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-12 px-4 py-12">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">How it started</h2>
          <div className="mt-3 space-y-4 text-stone-700">
            <p>
              Kriah Trainer was started by <b>Eliyahu Cohen</b>, from the Syrian Jewish community. Children learning to read
              the Torah in our tradition, the tradition of Aram Tsoba (Aleppo), had very little to practise with at home.
              Most of the apps and recordings out there teach the Ashkenazi tunes, and even call the te&apos;amim by other
              names: what we call Kadma, they call Pashta.
            </p>
            <p>
              So he recorded every ta&apos;am himself, in the Syrian melody, and built a trainer around those recordings.
              Children hear each ta&apos;am exactly the way it&apos;s sung in shul, practise it into the microphone, and get
              stars and a tip every time. Then they read real pesukim, then whole aliyot, and finally a page of the Sefer
              Torah itself.
            </p>
          </div>
        </div>

        <Shot src="/images/teamim-levels.webp" alt="Level 1 of the te'amim trainer: Ma'arikh Tarha" />

        <div>
          <h2 className="text-2xl font-semibold text-stone-900">What makes it different</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Syrian names and tunes", "Every ta'am has its Syrian name, as used by the Sephardic Pizmonim Project, and is sung in the Syrian melody."],
              ["A real voice, not a machine", "Every recording is a person singing, not a computer. Slow it down as much as you need: the tune stays the same."],
              ["One level at a time", "Eight levels, easiest first. Teachers open the next level when the class is ready, so no one is overwhelmed."],
              ["From the book to the scroll", "Read with nikkud and te'amim, then switch to Torah Scroll Mode: the real columns of a Sefer Torah, in Sephardic letters with their crowns."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-stone-900">{t}</h3>
                <p className="mt-1 text-sm text-stone-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>

        <Shot src="/images/shirat-hayam.webp" alt="Shirat HaYam in Torah Scroll Mode" />

        <div>
          <h2 className="text-2xl font-semibold text-stone-900">What&apos;s next</h2>
          <p className="mt-3 text-stone-700">
            A reading trainer for the youngest children, kindergarten and first grade: first the sounds of the letters, then
            the nekudot, so they&apos;re ready for the te&apos;amim when the time comes.
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="text-lg font-semibold text-stone-900">With thanks</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-stone-600">
            <li>
              Te&apos;amim names: the Sephardic Pizmonim Project (pizmonim.org).
            </li>
            <li>
              Torah text: Miqra According to the Masorah, from Hebrew Wikisource (CC BY-SA 4.0), with the Sephardic scroll
              spellings.
            </li>
            <li>Sefer Torah column layout: tikkun.io (MIT licence).</li>
            <li>Scroll letters: Stam Sefarad CLM by Yoram Gnat, Culmus Project (GPL with font exception).</li>
          </ul>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/demo/" className="rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800">
            Try the free demo
          </Link>
          <Link
            href="/subscribe/"
            className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 hover:bg-stone-50"
          >
            See the plans
          </Link>
        </div>
      </section>
    </main>
  );
}
