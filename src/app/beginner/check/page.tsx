import type { Metadata } from "next";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { SoundCheck } from "@/components/beginner/SoundCheck";

export const metadata: Metadata = { title: "Check sound and microphone · Beginner Keriah" };

export default function CheckPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <BeginnerNav here="Check sound and microphone" />
      <h1 className="mt-1 text-3xl font-semibold text-stone-900">Check sound and microphone</h1>
      <p className="mt-1 mb-5 text-stone-600">
        If you can&apos;t hear the Hazzan, or the trainer can&apos;t hear the child, try these two tests.
      </p>
      <SoundCheck />
    </main>
  );
}
