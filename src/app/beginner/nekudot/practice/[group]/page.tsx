import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BeginnerNav } from "@/components/beginner/BeginnerNav";
import { BeginnerLock } from "@/components/beginner/Lock";
import { NekudaTrainer } from "@/components/beginner/NekudaTrainer";
import { NEKUDA_GROUPS, groupLevel } from "@/data/nekuda-groups";
import { NEKUDOT } from "@/data/beginner";
import { NekudaLetters } from "@/components/beginner/NekudaLetters";
import { FullChart } from "@/components/beginner/FullChart";

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
        <NekudaTrainer
          group={g}
          intro={
            g.id === "all" ? (
              <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-stone-900">Every letter with every nekuda</h2>
                <FullChart />
              </section>
            ) : (
              <div className="space-y-4">
                {g.nekudot.map((id) => {
                  const n = NEKUDOT.find((x) => x.id === id)!;
                  return (
                    <section key={id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <h2 className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-lg font-semibold text-stone-900">
                        <span>
                          {n.name} <span className="font-normal text-stone-500">says &ldquo;{n.sound}&rdquo;</span>
                        </span>
                        <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
                          {n.he}
                        </span>
                      </h2>
                      {(id === "sere" || id === "segol") && (
                        <p className="mb-2 text-sm text-sky-900">
                          A Yod after a {n.name} is silent: <span lang="he" className="font-hebrew text-lg">בֵּי</span> says &ldquo;be&rdquo;.
                        </p>
                      )}
                      <p className="mb-2 text-sm text-stone-600">Tap a letter to hear it.</p>
                      <NekudaLetters id={id} small />
                    </section>
                  );
                })}
              </div>
            )
          }
        />
      </BeginnerLock>
    </main>
  );
}
