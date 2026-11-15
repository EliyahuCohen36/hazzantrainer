"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { BEGINNER_LEVELS } from "@/data/beginner";
import { FIRST_WORD_LEVEL, LAST_WORD_LEVEL, newWords, wordsUpTo, type PracticeWord } from "@/data/beginner-words";
import { syllableRecordings } from "@/data/beginner-recordings";
import { recordingUrl } from "@/lib/recordings";
import { applySpeed, getSpeed } from "@/lib/audio/speed";
import { loadProgress, recordPractice, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { SpeedControl } from "@/components/audio/SpeedControl";

const ROUND = 10;
type Mode = "listen" | "read";
const stars = (s: number) => (s >= 90 ? 3 : s >= 70 ? 2 : s >= 50 ? 1 : 0);
export const wordsKey = (level: number, mode: Mode) => `beginner-words:${level}:${mode}`;

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** A round: mostly words with the newest nekudot, plus some review of earlier ones. */
function pickRound(level: number, pool: PracticeWord[]): PracticeWord[] {
  const fresh = new Set(newWords(Math.min(level, LAST_WORD_LEVEL)).map((w) => w.w));
  const isAll = level > LAST_WORD_LEVEL;
  const a = shuffle(pool.filter((w) => isAll || fresh.has(w.w)));
  const b = shuffle(pool.filter((w) => !isAll && !fresh.has(w.w)));
  const nNew = level === FIRST_WORD_LEVEL || isAll ? ROUND : 7;
  const round = [...a.slice(0, nNew), ...b.slice(0, ROUND - nNew)];
  return shuffle(round.length < ROUND ? [...round, ...a.slice(nNew), ...b.slice(ROUND - nNew)].slice(0, ROUND) : round);
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

function Word({ w, size = "text-6xl sm:text-7xl" }: { w: string; size?: string }) {
  return (
    <span dir="rtl" lang="he" className={`font-hebrew leading-tight ${size}`}>
      {w}
    </span>
  );
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
 * Word practice for Beginner Keriah, graded:
 *  - Listen and pick: the word is sounded out in the Hazzan's voice; the child taps it.
 *  - Read aloud: the child reads the word; a grown-up taps ✓ or ✗.
 */
export function WordPractice() {
  const { beginnerLevel } = useAuth();
  const maxLevel = Math.min(beginnerLevel, LAST_WORD_LEVEL + 1);
  const levels = BEGINNER_LEVELS.filter((l) => l.n >= FIRST_WORD_LEVEL && l.n <= maxLevel);
  const [level, setLevel] = useState(maxLevel);
  const [mode, setMode] = useState<Mode>("listen");
  const [round, setRound] = useState<PracticeWord[] | null>(null);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const { play, playing } = usePlayer();
  const best = useBest();

  // ?level=6 opens that level (if it's open).
  useEffect(() => {
    const q = Number(new URLSearchParams(location.search).get("level"));
    setLevel(q >= FIRST_WORD_LEVEL && q <= maxLevel ? q : maxLevel);
  }, [maxLevel]);

  const pool = useMemo(() => wordsUpTo(Math.min(level, LAST_WORD_LEVEL)), [level]);
  const listenPool = useMemo(() => pool.filter((w) => syllableRecordings(w.s)), [pool]);
  const canListen = listenPool.length >= 4;

  const start = (m: Mode) => {
    setMode(m);
    setRound(pickRound(level, m === "listen" ? listenPool : pool));
    setI(0);
    setRight(0);
    setAnswer(null);
    setDone(null);
  };

  const word = round?.[i];
  const sound = word ? syllableRecordings(word.s) : null;

  // Listen and pick: the word and two others with the same number of syllables.
  const choices = useMemo(() => {
    if (!word || mode !== "listen") return [];
    const same = shuffle(pool.filter((w) => w.w !== word.w && w.s.length === word.s.length));
    const other = shuffle(pool.filter((w) => w.w !== word.w && w.s.length !== word.s.length));
    return shuffle([word, ...[...same, ...other].slice(0, 2)]);
  }, [word, mode, pool]);

  useEffect(() => {
    if (mode === "listen" && sound && answer === null) void play(sound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, mode]);

  const next = (ok: boolean) => {
    const r = right + (ok ? 1 : 0);
    setRight(r);
    if (i + 1 >= (round?.length ?? 0)) {
      const score = Math.round((100 * r) / (round?.length || 1));
      recordPractice(wordsKey(level, mode), score);
      setDone(score);
    } else {
      setI(i + 1);
      setAnswer(null);
    }
  };

  if (beginnerLevel < FIRST_WORD_LEVEL) return null;

  const levelName = (n: number) => (n > LAST_WORD_LEVEL ? "All the nekudot" : BEGINNER_LEVELS.find((l) => l.n === n)?.title ?? `Level ${n}`);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm text-stone-600">
          Nekudot:{" "}
          <select
            value={level}
            onChange={(e) => {
              setLevel(Number(e.target.value));
              setRound(null);
            }}
            className="ms-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-900"
          >
            {levels.map((l) => (
              <option key={l.n} value={l.n}>
                {l.n > LAST_WORD_LEVEL ? "All the nekudot" : l.title}
                {l.n > FIRST_WORD_LEVEL && l.n <= LAST_WORD_LEVEL ? " + review" : ""}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-stone-500">{pool.length} words</span>
        <div className="ms-auto">
          <SpeedControl compact />
        </div>
      </div>

      {!round && (
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
            {best[wordsKey(level, "listen")] !== undefined && (
              <span className="mt-2 block text-sm text-amber-700">
                Best: {"★".repeat(stars(best[wordsKey(level, "listen")])) || "☆"} {best[wordsKey(level, "listen")]}%
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => start("read")}
            className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 text-left transition-colors hover:bg-sky-100"
          >
            <span className="text-3xl">🗣️</span>
            <span className="mt-2 block text-xl font-semibold text-stone-900">Read aloud</span>
            <span className="mt-1 block text-stone-600">Read each word out loud to a grown-up. They tap ✓ or ✗.</span>
            {best[wordsKey(level, "read")] !== undefined && (
              <span className="mt-2 block text-sm text-sky-700">
                Best: {"★".repeat(stars(best[wordsKey(level, "read")])) || "☆"} {best[wordsKey(level, "read")]}%
              </span>
            )}
          </button>
        </div>
      )}

      {round && done === null && word && (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              Word {i + 1} of {round.length}
            </span>
            <span>{levelName(level)}</span>
            <button type="button" onClick={() => setRound(null)} className="underline">
              Stop
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * i) / round.length}%` }} />
          </div>

          {mode === "listen" ? (
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
                  const picked = answer === c.w;
                  const isRight = c.w === word.w;
                  const tone =
                    answer === null
                      ? "border-stone-200 bg-white hover:bg-amber-50"
                      : isRight
                        ? "border-emerald-400 bg-emerald-50"
                        : picked
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

      {done !== null && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-5xl text-amber-500">{"★".repeat(stars(done)) + "☆".repeat(3 - stars(done))}</p>
          <p className="mt-3 text-2xl font-semibold text-stone-900">
            {right} of {round?.length} right
          </p>
          <p className="mt-1 text-stone-600">
            {done >= 90 ? "Excellent reading!" : done >= 70 ? "Great job! A little more practice and you'll have it." : "Good try! Let's practise these again."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={() => start(mode)} className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
              Again
            </button>
            <button type="button" onClick={() => setRound(null)} className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
