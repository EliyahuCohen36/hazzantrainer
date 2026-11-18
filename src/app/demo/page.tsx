import type { Metadata } from "next";
import Link from "next/link";
import { TorahTeamim } from "@/components/tanakh/TorahTeamim";
import { DEMO_TEAMIM } from "@/data/demo";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { BeginnerDemo } from "@/components/beginner/BeginnerDemo";

export const metadata: Metadata = { title: "Free demo · Keriah Trainer" };

/** Open to everyone: a few te'amim with the Hazzan's recordings and Practice. */
export default function DemoPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <h1 className="text-3xl font-semibold text-stone-900">Try Keriah Trainer</h1>
      <div className="mb-4 mt-5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
        <SpeedControl />
      </div>

      <h2 className="text-2xl font-semibold text-stone-900">Beginner Keriah: read your first words</h2>
      <p className="mt-1 mb-4 text-stone-600">
        Words from the Torah with the &ldquo;a&rdquo; sound (Qamats and Patah). Hear the Hazzan and pick the word, see a
        word and pick its sound, and say words into the microphone: the trainer listens and checks.
      </p>
      <BeginnerDemo />

      <h2 className="mt-10 text-2xl font-semibold text-stone-900">Torah reading: the te&apos;amim</h2>
      <p className="mt-1 mb-5 text-stone-600">
        Three te&apos;amim from the trainer. Listen to the Hazzan, then press <b>Practice</b> and sing it: you&apos;ll get
        stars and a tip. Schools get all the te&apos;amim, the listening quiz, the whole Torah text and a teacher view.
      </p>
      <TorahTeamim only={DEMO_TEAMIM} />
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-semibold text-stone-900">Want this for your class?</p>
        <p className="mt-1 text-sm text-stone-600">
          Students and teachers whose school has signed up can{" "}
          <Link href="/login/" className="font-medium text-amber-800 underline">
            sign in
          </Link>{" "}
          or{" "}
          <Link href="/join/" className="font-medium text-amber-800 underline">
            create an account with their code
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
