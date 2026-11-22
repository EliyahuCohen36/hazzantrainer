"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { EMET_TEAMIM, PROSE_TEAMIM, type TaamReference, taught } from "@/data/teamim-reference";
import { TEAMIM_LEVELS } from "@/data/teamim-levels";
import { tuneRecording, type TuneSet } from "@/data/tanakh-recordings";
import { useFolder } from "@/lib/recordings";
import { Recording } from "@/components/audio/Recording";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { WithMaamid } from "@/components/reader/Maamid";
import { TaamSubmit, isLearned, useLearned } from "./TaamSubmit";
import { TaamWords, TaamWordsQuiz } from "./TaamWords";


/** One ta'am per level, in the same order as the Torah trainer (Ta'amei Emet: by their own order). */
export function tuneLevels(tune: TuneSet): TaamReference[] {
  if (tune.system === "emet") {
    return EMET_TEAMIM.filter(taught).sort((a, b) => (a.level ?? 9) - (b.level ?? 9));
  }
  const byId = new Map(PROSE_TEAMIM.map((t) => [t.id, t]));
  const ids = TEAMIM_LEVELS.filter((l) => !l.kind).flatMap((l) => l.teamim);
  return ids.map((id) => byId.get(id)).filter((t): t is TaamReference => !!t);
}


/**
 * The te'amim trainer for one tune (Nevi'im, Tehillim, Ester…): one ta'am per level, and a ta'am
 * opens only after the one before it was learned (students: a grade of 7+ from their teacher). A level whose recording isn't
 * uploaded yet doesn't hold anyone back. The trainer appears as soon as the first recording is there.
 */
export function TuneTrainer({ tune }: { tune: TuneSet }) {
  const { profile } = useAuth();
  const free = profile?.role === "teacher" || profile?.role === "admin";
  const admin = profile?.role === "admin";
  const levels = useMemo(() => tuneLevels(tune), [tune]);
  const have = useFolder(`/audio/teamim/${tune.id}`);
  const best = useLearned();
  const student = profile?.role === "student";
  const src = (t: TaamReference) => tuneRecording(tune.id, t.id!);
  const recorded = (t: TaamReference) => !!have?.has(src(t));
  const passed = (t: TaamReference) => !recorded(t) || isLearned(best, src(t), student);
  const isOpen = (k: number) => free || levels.slice(0, k).every(passed);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let k = 0;
    while (k + 1 < levels.length && isOpen(k + 1) && recorded(levels[k])) k++;
    setShown(k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [have]);

  if (have === null) return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />;
  const any = levels.some(recorded);
  if (!any && !admin)
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center text-stone-700">
        🎙️ The Hazzan&apos;s recordings for this melody are coming soon. The trainer opens as soon as they&apos;re added.
      </div>
    );

  const t = levels[shown];
  const open = isOpen(shown);
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-900">Levels</h2>
      <p className="mt-1 text-sm text-stone-600">
        {student
          ? "Record each ta'am for your teacher. A grade of 7 or more opens the next one."
          : "Listen, learn each ta'am, and press \"I've learned it\" to open the next one."}
      </p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {levels.map((l, k) => {
          const o = isOpen(k);
          const done = recorded(l) && isLearned(best, src(l), student);
          return (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setShown(k)}
                className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-3 text-sm font-semibold ${
                  shown === k
                    ? "border-amber-700 bg-amber-700 text-white"
                    : done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : o
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-stone-200 bg-stone-50 text-stone-400"
                }`}
              >
                {done ? "✓" : !o ? "🔒" : null}
                {k + 1}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 border-t border-stone-100 pt-4">
        {!open ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-center">
            <div className="text-3xl">🔒</div>
            <p className="mt-2 font-medium text-stone-800">Level {shown + 1}</p>
            <p className="mt-1 text-sm text-stone-600">Finish the level before it first.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[13rem_1fr]">
            <div className="flex items-start gap-3">
              <span dir="rtl" lang="he" className="hebrew-text w-14 shrink-0 text-center font-hebrew text-4xl leading-[1.9] text-amber-800">
                <WithMaamid text={t.sample} />
              </span>
              <div>
                <div className="font-semibold text-stone-900">
                  {shown + 1}. {t.syrian}
                </div>
                <div dir="rtl" lang="he" className="text-left font-hebrew text-stone-600">
                  {t.hebrew}
                </div>
                {t.note && <div className="mt-1 text-sm text-stone-600">{t.note}</div>}
              </div>
            </div>
            <div className="space-y-2">
              {admin && <AdminDrop path={src(t)} exists={recorded(t)} compact label={recorded(t) ? "Replace this recording" : "Drop the recording here"} />}
              {recorded(t) ? (
                <>
                  <Recording src={src(t)} />
                  <TaamSubmit src={src(t)} label={t.syrian} tune={tune.id} />
                </>
              ) : (
                <p className="text-sm text-stone-500">The recording for this ta&apos;am is coming soon.</p>
              )}
              <TaamWords tune={tune.id} taam={t.id!} />
            </div>
          </div>
        )}
      </div>
      <TaamWordsQuiz tune={tune.id} pool={levels.filter((_, k) => isOpen(k))} />
    </section>
  );
}
