"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PROSE_TEAMIM } from "@/data/teamim-reference";
import { TORAH_TEAMIM_RECORDINGS } from "@/data/teamim-recordings";
import { MAX_LEVEL, TEAMIM_LEVELS, levelOf, openTeamim } from "@/data/teamim-levels";
import { loadProgress, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { TaamCard } from "./TorahTeamim";

const BY_ID = new Map(PROSE_TEAMIM.map((t) => [t.id, t]));
const TWO_STARS = 70;

function useBestScores() {
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => setBest(loadProgress().practice);
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    return () => window.removeEventListener(PROGRESS_EVENT, read);
  }, []);
  return best;
}

/**
 * The te'amim trainer in levels, easiest first. Children see the levels their
 * teacher has opened; the rest show a lock. Teachers and admins see all.
 */
export function TeamimLevels() {
  const { level: reached, profile } = useAuth();
  const isStudent = profile?.role === "student";
  const maxOpen = Math.min(reached, MAX_LEVEL);
  const open = useMemo(() => openTeamim(maxOpen), [maxOpen]);
  const best = useBestScores();
  const [shown, setShown] = useState(maxOpen);

  // Start on the newest open level; follow links like #segolta to the right level.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && BY_ID.has(id)) {
        const l = levelOf(id);
        if (l <= maxOpen) {
          setShown(l);
          setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }
      } else setShown(maxOpen);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [maxOpen]);

  const stars = (l: number) => {
    const ids = TEAMIM_LEVELS[l - 1].teamim.filter((id) => TORAH_TEAMIM_RECORDINGS[id]);
    const done = ids.filter((id) => (best[TORAH_TEAMIM_RECORDINGS[id]] ?? 0) >= TWO_STARS).length;
    return { done, total: ids.length };
  };

  const lvl = TEAMIM_LEVELS[shown - 1];
  const locked = shown > maxOpen;
  const s = stars(shown);

  return (
    <section id="teamim" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-stone-900">Levels</h2>
        {!isStudent && (
          <span className="text-xs text-stone-500">Teachers see every level. Open levels for a class in My classes.</span>
        )}
      </div>

      {/* Step path */}
      <ol className="mt-3 flex flex-wrap gap-2" aria-label="Levels">
        {TEAMIM_LEVELS.map((l) => {
          const isOpen = l.n <= maxOpen;
          const st = stars(l.n);
          const complete = isOpen && st.total > 0 && st.done === st.total;
          return (
            <li key={l.n}>
              <button
                type="button"
                onClick={() => {
                  setShown(l.n);
                  history.replaceState(null, "", location.pathname);
                }}
                aria-current={shown === l.n ? "step" : undefined}
                className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-3 text-sm font-semibold transition-colors ${
                  shown === l.n
                    ? "border-amber-700 bg-amber-700 text-white"
                    : complete
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : isOpen
                        ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
                title={isOpen ? `Level ${l.n}: ${l.title}` : `Level ${l.n} (locked)`}
              >
                {complete ? "✓" : !isOpen ? "🔒" : null}
                {l.n}
              </button>
            </li>
          );
        })}
      </ol>

      {/* A locked level doesn't say what's in it (owner's request). */}
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-stone-100 pt-4">
        <h3 className="text-lg font-semibold text-stone-900">
          Level {lvl.n}
          {!locked && `: ${lvl.title}`}
        </h3>
        {!locked && (
          <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
            {lvl.hebrew}
          </span>
        )}
      </div>
      {!locked && <p className="mt-1 text-sm text-stone-600">{lvl.about}</p>}

      {locked ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-5 text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-2 font-medium text-stone-800">This level isn&apos;t open yet.</p>
          <p className="mt-1 text-sm text-stone-600">
            Finish Level {maxOpen} first. Your teacher will open Level {shown} when you&apos;re ready.
          </p>
        </div>
      ) : (
        <>
          {s.total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-stone-500">
                <span>
                  {s.done} of {s.total} with 2 stars or more
                </span>
                {s.done === s.total && <span className="font-semibold text-emerald-700">Level complete!</span>}
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(100 * s.done) / s.total}%` }} />
              </div>
            </div>
          )}
          {isStudent && s.total > 0 && s.done === s.total && shown === maxOpen && maxOpen < MAX_LEVEL && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              🎉 Great work! Show your teacher, and ask them to open Level {maxOpen + 1}.
            </p>
          )}
          <ul className="mt-2">
            {lvl.teamim.map((id) => {
              const t = BY_ID.get(id);
              return t ? <TaamCard key={id} t={t} open={open} /> : null;
            })}
          </ul>
        </>
      )}

      <p className="mt-4 text-xs text-stone-400">
        Names follow the Sephardic Pizmonim Project (pizmonim.org). Examples are from the Westminster Leningrad Codex.
      </p>
    </section>
  );
}
