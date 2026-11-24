"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PROSE_TEAMIM } from "@/data/teamim-reference";
import { TORAH_TEAMIM_PAIRS, TORAH_TEAMIM_RECORDINGS } from "@/data/teamim-recordings";
import { COMBO_RECORDINGS, LEVEL_LESSONS, MAX_LEVEL, TEAMIM_LEVELS, levelOf, openTeamim } from "@/data/teamim-levels";
import { STRESS_KEY } from "@/data/stress-words";
import { MilelMilra } from "./MilelMilra";
import { Recording } from "@/components/audio/Recording";
import { TaamSubmit, isLearned, useLearned } from "./TaamSubmit";
import { useExistingRecordings } from "@/lib/recordings";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { recordPractice } from "@/lib/audio/taam-practice";
import { TaamCard } from "./TorahTeamim";
import { TaamWordsQuiz } from "./TaamWords";

const BY_ID = new Map(PROSE_TEAMIM.map((t) => [t.id, t]));

/**
 * The te'amim trainer in levels, easiest first. Children see the levels their
 * teacher has opened; the rest show a lock. Teachers and admins see all.
 */
export function TeamimLevels() {
  const { level: reached, profile, refresh } = useAuth();
  const isStudent = profile?.role === "student";
  const maxOpen = Math.min(reached, MAX_LEVEL);
  const open = useMemo(() => openTeamim(maxOpen), [maxOpen]);
  const best = useLearned();
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

  const comboPaths = useMemo(() => Object.values(COMBO_RECORDINGS).flat().map(([, p]) => p), []);
  const haveCombo = useExistingRecordings(comboPaths);
  // The recordings that must be learned to finish a level: its solo recordings, the combo ones,
  // or (a mesharet with no solo recording) its pairs with te'amim already learned.
  const levelSrcs = (l: number): string[] => {
    const L = TEAMIM_LEVELS[l - 1];
    if (L.kind === "stress") return [];
    if (L.kind === "combo") return (COMBO_RECORDINGS[l] ?? []).map(([, p]) => p).filter((p) => haveCombo?.has(p));
    const solo = L.teamim.map((id) => TORAH_TEAMIM_RECORDINGS[id]).filter(Boolean);
    if (solo.length) return solo;
    return TORAH_TEAMIM_PAIRS.filter((p) => L.teamim.includes(p.first) && levelOf(p.second) <= l).map((p) => p.src);
  };
  // Students pass with a grade of 7+ from their teacher; everyone else marks a ta'am as learned.
  const stars = (l: number) => {
    const L = TEAMIM_LEVELS[l - 1];
    if (L.kind === "stress") return { done: (best[STRESS_KEY] ?? 0) >= 80 ? 1 : 0, total: 1 };
    const srcs = levelSrcs(l);
    return { done: srcs.filter((src) => isLearned(best, src, isStudent)).length, total: srcs.length };
  };
  // A grade that finished the level opened the next one on the account: fetch the new level.
  const sDone = stars(maxOpen);
  useEffect(() => {
    if (isStudent && sDone.total > 0 && sDone.done === sDone.total) refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent, sDone.done, sDone.total]);

  // A finished level is saved (teamim-level:<n>), so personal subscribers' next level opens by itself.
  // A level with no recordings uploaded yet doesn't hold anyone back.
  useEffect(() => {
    if (haveCombo === null) return;
    for (let n = 1; n <= maxOpen; n++) {
      const st = stars(n);
      const finished = st.total === 0 ? TEAMIM_LEVELS[n - 1].kind !== "stress" : st.done === st.total;
      if (finished && (best[`teamim-level:${n}`] ?? 0) < 100) recordPractice(`teamim-level:${n}`, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [best, haveCombo, maxOpen]);

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
          {locked ? `Level ${lvl.n}` : `Level ${lvl.n}: ${lvl.title}`}
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
            Finish Level {maxOpen} first. When your teacher gives you 7 or more for it, the next level opens.
          </p>
        </div>
      ) : (
        <>
          {s.total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-stone-500">
                <span>
                  {isStudent ? `${s.done} of ${s.total} passed (7 or more from your teacher)` : `${s.done} of ${s.total} learned`}
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
              🎉 Great work! You passed this level. Level {maxOpen + 1} opens for you now.
            </p>
          )}
          {LEVEL_LESSONS[lvl.n] && (
            <div className="mt-3 space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-800">
              {LEVEL_LESSONS[lvl.n].map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          )}
          {lvl.kind === "stress" && <MilelMilra />}
          {lvl.kind === "combo" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(COMBO_RECORDINGS[lvl.n] ?? []).map(([label, src]) => (
                <div key={src} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                  <div className="mb-1.5 font-medium text-stone-900">{label}</div>
                  <AdminDrop path={src} compact />
                  {haveCombo?.has(src) ? (
                    <>
                      <Recording src={src} />
                      <div className="mt-2">
                        <TaamSubmit src={src} label={label} level={lvl.n} needed={levelSrcs(lvl.n).length} />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-stone-500">♪ Recording coming soon</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <ul className="mt-2">
            {lvl.teamim.map((id) => {
              const t = BY_ID.get(id);
              return t ? <TaamCard key={id} t={t} open={open} lv={{ n: lvl.n, srcs: levelSrcs(lvl.n) }} /> : null;
            })}
          </ul>
          {/* A review every 2 levels (owner, Nov 24): the Hazzan's words for every ta'am learned up to here. */}
          {lvl.n % 2 === 0 && (
            <TaamWordsQuiz
              key={`review-${lvl.n}`}
              tune="torah"
              title={`🔁 Review of levels 1–${lvl.n}: which ta'am?`}
              pool={PROSE_TEAMIM.filter((t) => t.id && !t.hidden && openTeamim(lvl.n).has(t.id))}
            />
          )}
        </>
      )}

      {lvl.n % 2 !== 0 && <TaamWordsQuiz tune="torah" pool={PROSE_TEAMIM.filter((t) => t.id && open.has(t.id) && !t.hidden)} />}

      <p className="mt-4 text-xs text-stone-400">
        Names follow the Sephardic Pizmonim Project (pizmonim.org). Examples are from the Westminster Leningrad Codex.
      </p>
    </section>
  );
}
