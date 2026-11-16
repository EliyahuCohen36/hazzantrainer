"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { BEGINNER_LEVELS, openLetters } from "@/data/beginner";

/** Shows its children once the child's teacher has opened level `need`; otherwise a lock. */
export function BeginnerLock({ need, children }: { need: number; children: React.ReactNode }) {
  const { beginnerLevel } = useAuth();
  if (beginnerLevel >= need) return <>{children}</>;
  const l = BEGINNER_LEVELS.find((x) => x.n === need);
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center">
      <p className="text-4xl">🔒</p>
      <p className="mt-2 text-lg font-semibold text-stone-800">
        Level {need}{l ? `: ${l.title}` : ""}
      </p>
      <p className="mt-1 text-stone-600">Your teacher will open this when you&apos;re ready.</p>
      <Link href="/beginner/" className="mt-4 inline-block rounded-xl bg-amber-700 px-4 py-2 font-semibold text-white hover:bg-amber-800">
        Back to my levels
      </Link>
    </div>
  );
}

/** A tile that is greyed out with a lock until level `need` is open. */
export function LockTile({ need, children }: { need: number; children: React.ReactNode }) {
  const { beginnerLevel } = useAuth();
  if (beginnerLevel >= need) return <>{children}</>;
  return (
    <div className="relative" title="Your teacher will open this soon">
      <div className="pointer-events-none opacity-25 grayscale" aria-hidden>
        {children}
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-2xl">🔒</span>
    </div>
  );
}

/** The path of beginner levels, with locks on the ones not open yet. */
export function BeginnerLevelPath() {
  const { beginnerLevel, profile } = useAuth();
  const isStudent = profile?.role === "student";
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-stone-900">{isStudent ? "My levels" : "The levels"}</h2>
      <p className="mt-1 text-stone-600">
        {isStudent
          ? "Learn one level at a time. Your teacher opens the next level when you're ready."
          : "Children see only the levels their teacher opens (set them in My classes)."}
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BEGINNER_LEVELS.map((l) => {
          const open = beginnerLevel >= l.n;
          const inner = (
            <span className="flex items-center gap-3">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  open ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-500"
                }`}
              >
                {open ? l.n : "🔒"}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-stone-900">{l.title}</span>
                <span dir="rtl" lang="he" className="block font-hebrew text-lg text-amber-800">
                  {l.he}
                </span>
              </span>
            </span>
          );
          return (
            <li key={l.n}>
              {open ? (
                <Link
                  href={l.href}
                  className="block rounded-2xl border border-amber-200 bg-white p-3 shadow-sm transition-colors hover:bg-amber-50"
                >
                  {inner}
                </Link>
              ) : (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 opacity-70">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** A letter tile, greyed out with a lock until the teacher has opened that letter. */
export function LetterLock({ id, children }: { id: string; children: React.ReactNode }) {
  const { beginnerLevel, lettersOpen } = useAuth();
  if (openLetters(lettersOpen, beginnerLevel).some((l) => l.id === id)) return <>{children}</>;
  return (
    <div className="relative" title="Your teacher will open this letter soon">
      <div className="pointer-events-none opacity-25 grayscale" aria-hidden>
        {children}
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-2xl">🔒</span>
    </div>
  );
}
