"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { STAGE_PASS, STAGE_QUESTIONS, WORD_STAGES, stageKey, type PracticeWord, type WordStage } from "@/data/beginner-words";
import { syllableRecordings } from "@/data/beginner-recordings";
import { recordingUrl } from "@/lib/recordings";
import { applySpeed, getSpeed } from "@/lib/audio/speed";
import { loadProgress, recordPractice, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { SpeedControl } from "@/components/audio/SpeedControl";

type Mode = "listen" | "read";
const PASS_PCT = Math.round((100 * STAGE_PASS) / STAGE_QUESTIONS);
const stars = (s: number) => (s >= 95 ? 3 : s >= PASS_PCT ? 2 : s >= 50 ? 1 : 0);

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** 50 questions from the stage's words (repeating words if there are fewer than 50). */
function makeQuestions(words: PracticeWord[]): string[] {
  const out: string[] = [];
  while (out.length < STAGE_QUESTIONS && words.length) out.push(...shuffle(words).map((w) => w.w));
  return out.slice(0, STAGE_QUESTIONS);
}

/** A stage in progress, kept in the browser so a child can stop and carry on later. */
interface Run {
  mode: Mode;
  q: string[];
  i: number;
  right: number;
}
const runKey = (user: string, stage: string) => `kriah-word-run:${user}:${stage}`;
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

/** Plays a word, syllable by syllable, in the Hazzan's voice. */
function usePlayer() {
  const stop = useRef<() => void>(() => {});
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stop.current(), []);
  const play = async (paths: string[]) => {
    stop.current();
    let cancelled = false;
    let current: HTMLAudioElement | null = null;
    stop.current = () => {
      cancelled = true;
      current?.pause();
      setPlaying(false);
    };
    setPlaying(true);
    const urls = await Promise.all(paths.map((p) => recordingUrl(p)));
    for (const u of urls) {
      if (cancelled) return;
      const a = new Audio(u);
      current = a;
      applySpeed(a, getSpeed());
      await new Promise<void>((done) => {
        a.onended = () => done();
        a.onerror = () => done();
        void a.play().catch(() => done());
      });
      await new Promise((r) => setTimeout(r, 90));
    }
    if (!cancelled) setPlaying(false);
  };
  return { play, playing };
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

const Word = ({ w, size }: { w: string; size: string }) => (
  <span dir="rtl" lang="he" className={`font-hebrew leading-tight ${size}`}>
    {w}
  </span>
);

/**
 * Word practice for Beginner Keriah, in stages of 50 questions: one sound alone,
 * then the next sound alone, then the two together, and so on. A stage opens
 * only after the one before it is passed (and the teacher has opened its nekudot).
 * Two graded ways to practise:
 *  - Listen and pick: the word is sounded out in the Hazzan's voice; the child taps it.
 *  - Read aloud: the child reads the word; a grown-up taps ✓ or ✗.
 */
export function WordPractice() {
  const { beginnerLevel, profile } = useAuth();
  const user = profile?.id ?? "guest";
  const free = profile?.role === "teacher" || profile?.role === "admin";
  const best = useBest();
  const passed = (s: WordStage) => (best[stageKey(s.id)] ?? 0) >= PASS_PCT;
  const isOpen = (i: number) =>
    beginnerLevel >= WORD_STAGES[i].level && (free || i === 0 || passed(WORD_STAGES[i - 1]));

  const [stageId, setStageId] = useState<string | null>(null);
  const stage = WORD_STAGES.find((s) => s.id === stageId) ?? null;
  const [run, setRun] = useState<Run | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [done, setDone] = useState<{ score: number; right: number } | null>(null);
  const { play, playing } = usePlayer();

  const byWord = useMemo(() => new Map((stage?.words ?? []).map((w) => [w.w, w])), [stage]);
  const listenWords = useMemo(() => (stage?.words ?? []).filter((w) => syllableRecordings(w.s)), [stage]);
  const canListen = listenWords.length >= 4;

  const open = (s: WordStage) => {
    setStageId(s.id);
    setRun(loadRun(user, s.id));
    setAnswer(null);
    setDone(null);
  };
  const start = (m: Mode) => {
    if (!stage) return;
    const r: Run = { mode: m, q: makeQuestions(m === "listen" ? listenWords : stage.words), i: 0, right: 0 };
    setRun(r);
    saveRun(user, stage.id, r);
    setAnswer(null);
    setDone(null);
  };

  const word = run && stage ? byWord.get(run.q[run.i]) : undefined;
  const sound = word ? syllableRecordings(word.s) : null;

  const choices = useMemo(() => {
    if (!word || run?.mode !== "listen" || !stage) return [];
    const others = shuffle(stage.words.filter((w) => w.w !== word.w));
    const same = others.filter((w) => w.s.length === word.s.length);
    return shuffle([word, ...[...same, ...others.filter((w) => w.s.length !== word.s.length)].slice(0, 2)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.w, run?.mode, stage]);

  useEffect(() => {
    if (run?.mode === "listen" && sound && answer === null) void play(sound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.w, run?.mode]);

  const next = (ok: boolean) => {
    if (!run || !stage) return;
    const r = { ...run, i: run.i + 1, right: run.right + (ok ? 1 : 0) };
    setAnswer(null);
    if (r.i >= r.q.length) {
      const score = Math.round((100 * r.right) / r.q.length);
      recordPractice(stageKey(stage.id), score);
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
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                : "Starts once the Hazzan's recordings for these letters are added. Try Read aloud for now."}
            </span>
          </button>
          <button
            type="button"
            onClick={() => start("read")}
            className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 text-left transition-colors hover:bg-sky-100"
          >
            <span className="text-3xl">🗣️</span>
            <span className="mt-2 block text-xl font-semibold text-stone-900">Read aloud</span>
            <span className="mt-1 block text-stone-600">Read each word out loud to a grown-up. They tap ✓ or ✗.</span>
          </button>
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

          {run.mode === "listen" ? (
            <>
              <button
                type="button"
                onClick={() => sound && play(sound)}
                className={`mt-6 inline-flex size-20 items-center justify-center rounded-full bg-amber-600 text-4xl text-white shadow hover:bg-amber-700 ${playing ? "animate-pulse" : ""}`}
                aria-label="Hear the word again"
              >
                🔊
              </button>
              <p className="mt-2 text-stone-600">Which word did you hear?</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {choices.map((c) => {
                  const isRight = c.w === word.w;
                  const tone =
                    answer === null
                      ? "border-stone-200 bg-white hover:bg-amber-50"
                      : isRight
                        ? "border-emerald-400 bg-emerald-50"
                        : answer === c.w
                          ? "border-rose-400 bg-rose-50"
                          : "border-stone-200 bg-white opacity-50";
                  return (
                    <button
                      key={c.w}
                      type="button"
                      disabled={answer !== null}
                      onClick={() => setAnswer(c.w)}
                      className={`rounded-2xl border-2 px-3 py-5 transition-colors ${tone}`}
                    >
                      <Word w={c.w} size="text-5xl" />
                    </button>
                  );
                })}
              </div>
              {answer !== null && (
                <div className="mt-5">
                  <p className={`text-lg font-semibold ${answer === word.w ? "text-emerald-700" : "text-rose-700"}`}>
                    {answer === word.w ? "Right! 🎉" : "Not quite. The green one is the word."}
                  </p>
                  <button
                    type="button"
                    onClick={() => next(answer === word.w)}
                    className="mt-3 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mt-8">
                <Word w={word.w} size="text-7xl sm:text-8xl" />
              </div>
              <p className="mt-4 text-stone-600">Read the word out loud.</p>
              {sound && (
                <button type="button" onClick={() => play(sound)} className="mt-2 text-sm font-medium text-amber-800 underline">
                  🔊 Hear how to read it
                </button>
              )}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => next(false)}
                  className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-6 py-4 text-lg font-semibold text-rose-800 hover:bg-rose-100"
                >
                  ✗ Not yet
                </button>
                <button
                  type="button"
                  onClick={() => next(true)}
                  className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-6 py-4 text-lg font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  ✓ Read it right
                </button>
              </div>
              <p className="mt-3 text-xs text-stone-400">For the grown-up: tap ✓ if the child read the word correctly.</p>
            </>
          )}
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
              : `Good try! You need ${STAGE_PASS} right to pass. Let's practise these again.`}
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
