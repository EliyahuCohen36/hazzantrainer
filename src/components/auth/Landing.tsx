import Link from "next/link";
import { LoginForm } from "./forms";
import { CONTACT_EMAIL } from "@/data/demo";

/** What visitors who aren't signed in see on the home page. */
export function Landing() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-[1fr_20rem] sm:items-start">
        <div>
          <p dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
            טעמי המקרא · מנהג ארם צובא
          </p>
          <h1 className="mt-1 text-4xl font-semibold text-stone-900">Kriah Trainer</h1>
          <p className="mt-3 text-lg text-stone-700">
            Torah reading in the Syrian tradition, taught by the Hazzan&apos;s own voice. Children hear every ta&apos;am,
            sing it back, and get a score and a tip each time they practise.
          </p>
          <ul className="mt-5 space-y-2 text-stone-700">
            <li>🎧 All the te&apos;amim with their Syrian names and the Hazzan&apos;s recordings</li>
            <li>🎤 Practice: the child sings, the trainer listens and gives stars</li>
            <li>📖 The whole Torah with te&apos;amim, every parasha and aliyah</li>
            <li>🧑‍🏫 Teachers see each child&apos;s progress</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo/"
              className="rounded-lg bg-amber-700 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-amber-800"
            >
              Try the free demo
            </Link>
            {CONTACT_EMAIL && (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Kriah%20Trainer%20for%20our%20school`}
              className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 font-semibold text-stone-800 hover:bg-stone-50"
            >
              Bring it to your school
            </a>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Students &amp; teachers</h2>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
