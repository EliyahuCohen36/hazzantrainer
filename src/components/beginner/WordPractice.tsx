"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { WORD_STAGES, sayKey, sayWordKey, stageKey, type PracticeWord, type WordStage } from "@/data/beginner-words";
import { WordQuestion, QUESTION_LABEL, MIC_ON, hasSound, mixedTypes, shuffle, type QuestionType } from "./WordQuestion";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { releaseMic } from "@/lib/audio/word-check";

type Mode = "mixed" | "listen" | "read";
import { useQuestions, passPct } from "@/lib/question-settings";

/** n questions from the stage's words (repeating words if there are fewer than n). */
function makeQuestions(words: PracticeWord[], n: number): string[] {
  const out: string[] = [];
  while (out.length < n && words.length) out.push(...shuffle(words).map((w) => w.w));
  return out.slice(0, n);
}

/** A stage in progress, kept in the browser so a child can stop and carry on later. */
interface Run {
  mode: Mode;
  q: string[];
  /** The kind of each question. */
  t?: QuestionType[];
  i: number;
  right: number;
}
const runKey = (user: string, stage: string) => `kriah-word-run-v2:${user}:${stage}`;
function loadRun(user: string, stage: string): Run | null {
  try {
    const r = localStorage.getItem(runKey(user, stage));
    return r ? (JSON.parse(r) as Run) : null;
  } catch {
    return null;
  }
}
function saveRun(user: string, stage: string, run: Run | null) {
  try {
    if (run) localStorage.setItem(runKey(user, stage), JSON.stringify(run));
    else localStorage.removeItem(runKey(user, stage));
  } catch {
    // ignore
  }
}

function useBest() {
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
 * Word practice for Beginner Keriah, in stages of 50 questions: one sound alone,
 * then the next sound alone, then the two together, and so on. A stage opens
 * only after the one before it is passed (and the teacher has opened its nekudot).
 * Two graded ways to practice:
 *  - Listen and pick: the word is sounded out in the Hazzan's voice; the child taps it.
 *  - Say it: the child says the word into the microphone; speech recognition checks it.
 */
export function WordPractice() {
  const { beginnerLevel, profile } = useAuth();
  const user = profile?.id ?? "guest";
  const free = profile?.role === "teacher" || profile?.role === "admin";
  const best = useBest();
  useEffect(() => () => releaseMic(), []);
  // How many questions and how many right (owner, Nov 20): the teacher's setting, or 50/40 for school
  // students and 25/20 for everyone else.
  const qset = useQuestions("words")!;
  const STAGE_QUESTIONS = qset.n;
  const STAGE_PASS = qset.pass;
  const PASS_PCT = passPct(qset);
  const stars = (s: number) => (s >= 95 ? 3 : s >= PASS_PCT ? 2 : s >= 50 ? 1 : 0);
  const passed = (s: WordStage) => (best[`${stageKey(s.id)}:passed`] ?? 0) >= 100 || (best[stageKey(s.id)] ?? 0) >= PASS_PCT;
  const isOpen = (i: number) =>
    beginnerLevel >= WORD_STAGES[i].level && (free || i === 0 || passed(WORD_STAGES[i - 1]));

  const [stageId, setStageId] = useState<string | null>(null);
  const stage = WORD_STAGES.find((s) => s.id === stageId) ?? null;
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState<{ score: number; right: number } | null>(null);

  const byWord = useMemo(() => new Map((stage?.words ?? []).map((w) => [w.w, w])), [stage]);
  const listenWords = useMemo(() => (stage?.words ?? []).filter(hasSound), [stage]);
  const canListen = listenWords.length >= 4;

  const open = (s: WordStage) => {
    setStageId(s.id);
    const saved = loadRun(user, s.id);
    setRun(!MIC_ON && saved?.mode === "read" ? null : saved);
    setDone(null);
  };
  const start = (m: Mode) => {
    if (!stage) return;
    const q = makeQuestions(m === "listen" ? listenWords : stage.words, STAGE_QUESTIONS);
    const words = q.map((w) => byWord.get(w)!);
    const t: QuestionType[] = m === "listen" ? q.map(() => "listen") : m === "read" ? q.map(() => "say") : mixedTypes(words, stage.words);
    const r: Run = { mode: m, q, t, i: 0, right: 0 };
    setRun(r);
    saveRun(user, stage.id, r);
    setDone(null);
  };

  const word = run && stage ? byWord.get(run.q[run.i]) : undefined;
  const savedType: QuestionType = run?.t?.[run.i] ?? (run?.mode === "read" ? "say" : "listen");
  const qType: QuestionType = !MIC_ON && savedType === "say" ? (run && run.i % 2 ? "sound" : "listen") : savedType;

  const next = (ok: boolean, said?: boolean) => {
    if (!run || !stage) return;
    // Track every word the child said: per step (for the teacher's table) and per word (words to practice).
    if (said !== undefined && word) {
      recordQuiz(sayKey(stage.id), said);
      recordQuiz(sayWordKey(word.w), said);
    }
    const r = { ...run, i: run.i + 1, right: run.right + (ok ? 1 : 0) };
    if (r.i >= r.q.length) {
      const score = Math.round((100 * r.right) / r.q.length);
      recordPractice(stageKey(stage.id), score);
      if (r.right >= Math.min(STAGE_PASS, r.q.length)) recordPractice(`${stageKey(stage.id)}:passed`, 100);
      saveRun(user, stage.id, null);
      setRun(null);
      setDone({ score, right: r.right });
    } else {
      setRun(r);
      saveRun(user, stage.id, r);
    }
  };

  // ── The path of stages ──
  if (!stage) {
    return (
      <div>
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Each step is <b>{STAGE_QUESTIONS} words</b>. Get at least <b>{STAGE_PASS} right</b> to open the next step.
        </p>
        <ol className="grid gap-3">
          {WORD_STAGES.map((s, i) => {
            const ok = isOpen(i);
            const b = best[stageKey(s.id)];
            const inProgress = ok ? loadRunSafe(user, s.id) : null;
            const waitingForTeacher = beginnerLevel < s.level;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!ok}
                  onClick={() => open(s)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                    ok ? "border-amber-200 bg-white hover:bg-amber-50" : "cursor-not-allowed border-stone-200 bg-stone-50 opacity-70"
                  }`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                      b !== undefined && b >= PASS_PCT ? "bg-emerald-500 text-white" : ok ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {b !== undefined && b >= PASS_PCT ? "✓" : ok ? i + 1 : "🔒"}
                  </span>
                  <span className="min-w-0 grow">
                    <span className="block font-semibold text-stone-900">{s.title}</span>
                    <span className="block text-sm text-stone-500">
                      {!ok
                        ? waitingForTeacher
                          ? "Your teacher will open these nekudot."
                          : "Pass the step before to open this one."
                        : inProgress
                          ? `In the middle: word ${inProgress.i + 1} of ${STAGE_QUESTIONS}`
                          : b !== undefined
                            ? `Best: ${Math.round((b * STAGE_QUESTIONS) / 100)} of ${STAGE_QUESTIONS} ${"★".repeat(stars(b))}`
                            : `${STAGE_QUESTIONS} words`}
                    </span>
                  </span>
                  <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
                    {s.he}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <button type="button" onClick={() => setStageId(null)} className="text-sm font-medium text-amber-800 underline">
          ← All steps
        </button>
        <span className="font-semibold text-stone-900">{stage.title}</span>
        <div className="ms-auto">
          <SpeedControl compact />
        </div>
      </div>

      {!run && !done && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => start("mixed")}
            className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-left transition-colors hover:bg-emerald-100 sm:col-span-3"
          >
            <span className="text-3xl">⭐</span>
            <span className="mt-2 block text-xl font-semibold text-stone-900">Mixed practice (best)</span>
            <span className="mt-1 block text-stone-600">
              {MIC_ON
                ? "A bit of everything: hear the Hazzan and pick the word, see a word and pick its sound, and say words out loud."
                : "A bit of everything: hear the Hazzan and pick the word, and see a word and pick its sound."}
            </span>
          </button>
          <button
            type="button"
            onClick={() => start("listen")}
            disabled={!canListen}
            className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 text-left transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-3xl">👂</span>
            <span className="mt-2 block text-xl font-semibold text-stone-900">Listen and pick</span>
            <span className="mt-1 block text-stone-600">
              {canListen
                ? "Listen to the Hazzan say a word, then tap the word you heard."
                : "Starts once the Hazzan's recordings for these letters are added."}
            </span>
          </button>
          {MIC_ON && <button
            type="button"
            onClick={() => start("read")}
            className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 text-left transition-colors hover:bg-sky-100"
          >
            <span className="text-3xl">🗣️</span>
            <span className="mt-2 block text-xl font-semibold text-stone-900">Read aloud</span>
            <span className="mt-1 block text-stone-600">Say each word into the microphone. The trainer listens and checks it.</span>
          </button>}
        </div>
      )}

      {run && word && (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              Word {run.i + 1} of {run.q.length}
            </span>
            <span>{run.right} right</span>
            <button
              type="button"
              onClick={() => {
                setRun(null);
                setStageId(null);
              }}
              className="underline"
              title="Your place is saved"
            >
              Stop for now
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * run.i) / run.q.length}%` }} />
          </div>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">{QUESTION_LABEL[qType]}</p>
          <WordQuestion key={`${run.i}-${word.w}`} word={word} type={qType} pool={stage.words} onAnswer={next} showDebug={free} />
        </div>
      )}

      {run && !word && (
        <p className="mt-5 text-center text-stone-600">
          This step has changed.{" "}
          <button type="button" className="underline" onClick={() => start(run.mode)}>
            Start it again
          </button>
          .
        </p>
      )}

      {done && (
        <div
          className={`mt-5 rounded-3xl border p-8 text-center ${done.right >= STAGE_PASS ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
        >
          <p className="text-5xl text-amber-500">{"★".repeat(stars(done.score)) + "☆".repeat(3 - stars(done.score))}</p>
          <p className="mt-3 text-2xl font-semibold text-stone-900">
            {done.right} of {STAGE_QUESTIONS} right
          </p>
          <p className="mt-1 text-stone-700">
            {done.right >= STAGE_PASS
              ? "You passed this step! The next step is open. 🎉"
              : `Good try! You need ${STAGE_PASS} right to pass. Let's practice these again.`}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {done.right < STAGE_PASS && (
              <button type="button" onClick={() => setDone(null)} className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => setStageId(null)}
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50"
            >
              {done.right >= STAGE_PASS ? "Next step →" : "All steps"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function loadRunSafe(user: string, stage: string) {
  return typeof window === "undefined" ? null : loadRun(user, stage);
}
