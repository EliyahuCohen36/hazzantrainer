import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { NekudaTrainer } from "@/components/beginner/NekudaTrainer";
import { NEKUDA_GROUPS, groupLevel } from "@/data/nekuda-groups";

export function generateStaticParams() {
  return NEKUDA_GROUPS.map((g) => ({ group: g.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ group: string }> }): Promise<Metadata> {
  const { group } = await params;
  return { title: `Practice ${NEKUDA_GROUPS.find((g) => g.id === group)?.title ?? "nekudot"} · Beginner Keriah` };
}

export default async function NekudaPracticePage({ params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  const g = NEKUDA_GROUPS.find((x) => x.id === group);
  if (!g) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <BeginnerNav here={`Practice: ${g.title}`} />
      <div className="mt-1 mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold text-stone-900">Practice: {g.title}</h1>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
          {g.he}
        </span>
      </div>
      <BeginnerLock need={g.id === "all" ? 11 : groupLevel(g)}>
        <NekudaTrainer group={g} />
      </BeginnerLock>
    </main>
  );
}
