"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeWord } from "@/data/beginner-words";
import { syllableRecordings } from "@/data/beginner-recordings";
import { joinedWordUrl } from "@/lib/audio/join-syllables";
import { applySpeed, getSpeed } from "@/lib/audio/speed";

/**
 * The kinds of question in word practice:
 *  - listen: hear the Hazzan say a word, tap the written word
 *  - sound:  see a written word, tap the sound (of three) that says it
 *  - say:    see a word and say it; record yourself and compare with the Hazzan;
 *            a grown-up taps ✓ or ✗
 */
export type QuestionType = "listen" | "sound" | "say";

export const QUESTION_LABEL: Record<QuestionType, string> = {
  listen: "Listen and pick the word",
  sound: "Pick the sound for the word",
  say: "Say the word",
};

export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const hasSound = (w: PracticeWord) => syllableRecordings(w.s) !== null;

/** Two other words to choose from: same number of syllables first. */
export function distractors(word: PracticeWord, pool: PracticeWord[], needSound: boolean): PracticeWord[] {
  const others = shuffle(pool.filter((w) => w.w !== word.w && (!needSound || hasSound(w))));
  const same = others.filter((w) => w.s.length === word.s.length);
  return [...same, ...others.filter((w) => w.s.length !== word.s.length)].slice(0, 2);
}

/** Plays a word in the Hazzan's voice: its syllables joined into one smooth word. */
export function useWordPlayer() {
  const current = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => current.current?.pause(), []);
  const play = async (word: PracticeWord) => {
    const paths = syllableRecordings(word.s);
    if (!paths) return;
    current.current?.pause();
    setPlaying(word.w);
    try {
      const a = new Audio(await joinedWordUrl(paths));
      current.current = a;
      applySpeed(a, getSpeed());
      a.onended = () => setPlaying(null);
      await a.play();
    } catch {
      setPlaying(null);
    }
  };
  return { play, playing };
}

const Word = ({ w, size }: { w: string; size: string }) => (
  <span dir="rtl" lang="he" className={`font-hebrew leading-tight ${size}`}>
    {w}
  </span>
);

/** Records the child for a few seconds so they can hear themselves next to the Hazzan. */
function useRecorder() {
  const [state, setState] = useState<"idle" | "recording" | "done" | "denied">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })));
        setState("done");
      };
      rec.current = r;
      r.start();
      setState("recording");
      setTimeout(() => r.state === "recording" && r.stop(), 4000);
    } catch {
      setState("denied");
    }
  };
  const stop = () => rec.current?.state === "recording" && rec.current.stop();
  return { state, url, start, stop };
}

/**
 * One question. Calls onAnswer(right) when the child has answered and pressed Next.
 * `pool` is where the wrong choices come from (words with the same sounds).
 */
export function WordQuestion({
  word,
  type,
  pool,
  onAnswer,
}: {
  word: PracticeWord;
  type: QuestionType;
  pool: PracticeWord[];
  onAnswer: (right: boolean) => void;
}) {
  const { play, playing } = useWordPlayer();
  const [answer, setAnswer] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const recorder = useRecorder();
  const choices = useMemo(
    () => (type === "say" ? [] : shuffle([word, ...distractors(word, pool, type === "sound")])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word.w, type],
  );
  const canHear = hasSound(word);

  // Listen: play the word as soon as the question appears.
  useEffect(() => {
    if (type === "listen") void play(word);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.w, type]);

  const right = answer === word.w;
  const result =
    answer !== null ? (
      <div className="mt-5">
        <p className={`text-lg font-semibold ${right ? "text-emerald-700" : "text-rose-700"}`}>
          {right ? "Right! 🎉" : type === "sound" ? "Not quite. Listen to the green one: that's the word." : "Not quite. The green one is the word."}
        </p>
        <button
          type="button"
          onClick={() => onAnswer(right)}
          className="mt-3 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
        >
          Next →
        </button>
      </div>
    ) : null;

  const tone = (isRight: boolean, isPicked: boolean) =>
    answer === null
      ? isPicked
        ? "border-amber-500 bg-amber-50"
        : "border-stone-200 bg-white hover:bg-amber-50"
      : isRight
        ? "border-emerald-400 bg-emerald-50"
        : isPicked
          ? "border-rose-400 bg-rose-50"
          : "border-stone-200 bg-white opacity-50";

  if (type === "listen") {
    return (
      <div>
        <button
          type="button"
          onClick={() => play(word)}
          className={`mt-6 inline-flex size-20 items-center justify-center rounded-full bg-amber-600 text-4xl text-white shadow hover:bg-amber-700 ${playing ? "animate-pulse" : ""}`}
          aria-label="Hear the word again"
        >
          🔊
        </button>
        <p className="mt-2 text-stone-600">Which word did you hear?</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {choices.map((c) => (
            <button
              key={c.w}
              type="button"
              disabled={answer !== null}
              onClick={() => {
                setPicked(c.w);
                setAnswer(c.w);
              }}
              className={`rounded-2xl border-2 px-3 py-5 transition-colors ${tone(c.w === word.w, picked === c.w)}`}
            >
              <Word w={c.w} size="text-5xl" />
            </button>
          ))}
        </div>
        {result}
      </div>
    );
  }

  if (type === "sound") {
    return (
      <div>
        <div className="mt-6">
          <Word w={word.w} size="text-7xl sm:text-8xl" />
        </div>
        <p className="mt-3 text-stone-600">Which sound says this word? Tap each one to listen, then choose.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {choices.map((c, i) => (
            <div key={c.w} className={`rounded-2xl border-2 p-4 transition-colors ${tone(c.w === word.w, picked === c.w)}`}>
              <button
                type="button"
                onClick={() => {
                  void play(c);
                  if (answer === null) setPicked(c.w);
                }}
                className={`inline-flex size-16 items-center justify-center rounded-full bg-amber-600 text-3xl text-white shadow hover:bg-amber-700 ${playing === c.w ? "animate-pulse" : ""}`}
                aria-label={`Sound ${i + 1}`}
              >
                🔊
              </button>
              <p className="mt-2 text-sm font-semibold text-stone-700">Sound {i + 1}</p>
            </div>
          ))}
        </div>
        {answer === null && (
          <button
            type="button"
            disabled={!picked}
            onClick={() => setAnswer(picked)}
            className="mt-5 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-40"
          >
            {picked ? `Choose sound ${choices.findIndex((c) => c.w === picked) + 1}` : "Tap a sound first"}
          </button>
        )}
        {result}
      </div>
    );
  }

  // say
  return (
    <div>
      <div className="mt-8">
        <Word w={word.w} size="text-7xl sm:text-8xl" />
      </div>
      <p className="mt-4 text-stone-600">Say the word out loud.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {recorder.state !== "recording" ? (
          <button
            type="button"
            onClick={recorder.start}
            className="rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-800 hover:bg-rose-100"
          >
            🎤 {recorder.state === "done" ? "Record again" : "Record me"}
          </button>
        ) : (
          <button
            type="button"
            onClick={recorder.stop}
            className="animate-pulse rounded-xl border-2 border-rose-400 bg-rose-100 px-4 py-2 font-semibold text-rose-800"
          >
            ⏹ Stop
          </button>
        )}
        {recorder.url && (
          <button
            type="button"
            onClick={() => {
              const a = new Audio(recorder.url!);
              void a.play();
            }}
            className="rounded-xl border-2 border-stone-200 bg-white px-4 py-2 font-semibold text-stone-800 hover:bg-stone-50"
          >
            ▶ My voice
          </button>
        )}
        {canHear && (
          <button
            type="button"
            onClick={() => play(word)}
            className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
          >
            🔊 The Hazzan
          </button>
        )}
      </div>
      {recorder.state === "denied" && <p className="mt-2 text-xs text-stone-500">The microphone isn&apos;t on. You can still say it out loud.</p>}
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          onClick={() => onAnswer(false)}
          className="rounded-2xl border-2 border-rose-300 bg-rose-50 px-6 py-4 text-lg font-semibold text-rose-800 hover:bg-rose-100"
        >
          ✗ Not yet
        </button>
        <button
          type="button"
          onClick={() => onAnswer(true)}
          className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-6 py-4 text-lg font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          ✓ Said it right
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-400">For the grown-up: tap ✓ if the child said the word correctly.</p>
    </div>
  );
}

/** Question types for a mixed round: listen, sound, say in turn (only types the word's recordings allow). */
export function mixedTypes(words: PracticeWord[], pool: PracticeWord[]): QuestionType[] {
  const enoughSounds = pool.filter(hasSound).length >= 3;
  const order: QuestionType[] = ["listen", "sound", "say"];
  return words.map((w, i) => {
    const t = order[i % 3];
    if (t !== "say" && (!hasSound(w) || !enoughSounds)) return "say";
    return t;
  });
}
