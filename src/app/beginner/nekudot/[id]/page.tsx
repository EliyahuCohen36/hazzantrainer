import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NEKUDOT, nekudaLevel } from "@/data/beginner";
import { BeginnerLock } from "@/components/beginner/Lock";
import { NEKUDA_GROUPS } from "@/data/nekuda-groups";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { NekudaLetters } from "@/components/beginner/NekudaLetters";
import { SpeedControl } from "@/components/audio/SpeedControl";

export function generateStaticParams() {
  return NEKUDOT.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const n = NEKUDOT.find((x) => x.id === id);
  return { title: `${n?.name ?? "Nekuda"} · Beginner Keriah` };
}

/** One nekuda with every letter that takes it (and Khaf Sofit, where it does). */
export default async function NekudaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const i = NEKUDOT.findIndex((x) => x.id === id);
  if (i < 0) notFound();
  const n = NEKUDOT[i];
  const prev = NEKUDOT[i - 1];
  const next = NEKUDOT[i + 1];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <BeginnerNav here={n.name} />
      <div className="mt-1 mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">
          {n.name} <span className="text-xl font-normal text-stone-500">says &ldquo;{n.sound}&rdquo;</span>
        </h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          {n.he}
        </span>
      </div>
      <BeginnerLock need={nekudaLevel(n.id)}>
        {(n.id === "sere" || n.id === "segol") && (
          <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
            <b>A Yod after a {n.name} is silent.</b> It makes no sound of its own: <span lang="he" className="font-hebrew text-xl">בֵּי</span> says
            &ldquo;be&rdquo;, and <span lang="he" className="font-hebrew text-xl">אֲחֵי</span> says &ldquo;a-he&rdquo;.
          </p>
        )}
      {(() => {
        const g = NEKUDA_GROUPS.find((x) => x.id !== "all" && x.nekudot.includes(n.id));
        return g ? (
          <Link
            href={`/beginner/nekudot/practice/${g.id}/`}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 hover:bg-emerald-100"
          >
            <span>
              <span className="block text-lg font-semibold text-stone-900">⭐ Practice {g.title}</span>
              <span className="block text-sm text-stone-600">Hear a sound and find it, read it and pick the sound.</span>
            </span>
            <span className="font-semibold text-emerald-800">Start →</span>
          </Link>
        ) : null;
      })()}
      <div className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
        <SpeedControl compact />
      </div>

      <NekudaLetters id={n.id} />

        {nekudaLevel(n.id) <= 10 && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <Link href="/beginner/words/" className="text-lg font-semibold text-amber-900 underline">
              ⭐ Practice reading words with these nekudot
            </Link>
          </div>
        )}
      </BeginnerLock>

      <div className="mt-10 flex justify-between gap-3">
        {prev ? (
          <Link href={`/beginner/nekudot/${prev.id}/`} className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/beginner/nekudot/${next.id}/`} className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
            {next.name} →
          </Link>
        )}
      </div>
    </main>
  );
}
