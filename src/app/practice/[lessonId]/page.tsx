import Link from "next/link";
import { curriculum } from "@/lib/curriculum/repository";

export async function generateStaticParams() {
  return (await curriculum.listAllLessonIds()).map((lessonId) => ({ lessonId }));
}

/**
 * Singing practice with an automatic score was removed (owner, Nov 24 2026: comparing with the Hazzan's voice
 * was too unreliable). School students record for their teacher instead. Old links land here.
 */
export default function PracticePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">This page has moved</h1>
      <p className="mt-2 text-stone-600">
        Listen to the Hazzan on each aliyah of the Torah. School students record their reading there for their teacher to grade.
      </p>
      <Link href="/tanakh/torah/" className="mt-4 inline-block rounded-xl bg-amber-700 px-5 py-2.5 font-semibold text-white">
        Go to the Torah →
      </Link>
    </main>
  );
}
