"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PracticeWord } from "@/data/beginner-words";
import { syllableRecordings } from "@/data/beginner-recordings";
import { joinedWordUrl } from "@/lib/audio/join-syllables";
import { applySpeed, getSpeed } from "@/lib/audio/speed";
import { canCheckSpeech, listenFor } from "@/lib/audio/speech-check";

/**
 * The kinds of question in word practice:
 *  - listen: hear the Hazzan say a word, tap the written word
 *  - sound:  see a written word, tap the sound (of three) that says it
 *  - say:    see a word and say it; the browser's speech recognition checks it
 *            (a grown-up marks it only where the browser can't listen)
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

/** Listens for the word and checks it. Two tries; "didn't hear you" doesn't count as a try. */
function useSpeechCheck(target: string) {
  const [state, setState] = useState<"idle" | "listening" | "right" | "wrong" | "nothing" | "manual">(
    canCheckSpeech() ? "idle" : "manual",
  );
  const [tries, setTries] = useState(0);
  const [misses, setMisses] = useState(0);
  const [hearing, setHearing] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);
  const listen = async () => {
    setState("listening");
    setHearing(false);
    setHeard(null);
    const { done, stop } = listenFor(target, 7000, () => setHearing(true));
    stopRef.current = stop;
    const r = await done;
    if (r.ok === null) {
      if (r.reason === "nothing") setMisses((m) => m + 1);
      setState(r.reason === "nothing" ? "nothing" : "manual");
    }
    else {
      setTries((t) => t + 1);
      setHeard(r.heard[r.heard.length - 1] ?? null);
      setState(r.ok ? "right" : "wrong");
    }
  };
  return { state, tries, misses, hearing, heard, listen, stop: () => stopRef.current() };
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
  const speech = useSpeechCheck(word.w);
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
  const st = speech.state;
  const finalWrong = st === "wrong" && speech.tries >= 2;
  return (
    <div>
      <div className="mt-8">
        <Word w={word.w} size="text-7xl sm:text-8xl" />
      </div>
      {st === "manual" ? (
        <>
          <p className="mt-4 text-stone-600">Say the word out loud.</p>
          {canHear && (
            <button type="button" onClick={() => play(word)} className="mt-2 text-sm font-medium text-amber-800 underline">
              🔊 Hear the Hazzan
            </button>
          )}
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
          <p className="mx-auto mt-3 max-w-md text-xs text-stone-500">
            This browser can&apos;t listen (or the microphone is off), so a grown-up checks this one. In Chrome or Safari, with
            the microphone allowed, the trainer listens and checks by itself.
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-stone-600">
            {st === "idle" && "Tap the microphone and say the word."}
            {st === "listening" && (speech.hearing ? "I hear you… 👂" : "Listening… say the word now, nice and clear.")}
            {st === "nothing" && "I didn't hear you. Tap the microphone and try again, a little louder."}
          </p>
          {(st === "idle" || st === "nothing" || (st === "wrong" && !finalWrong)) && (
            <button
              type="button"
              onClick={speech.listen}
              className="mt-4 inline-flex size-20 items-center justify-center rounded-full bg-rose-600 text-4xl text-white shadow hover:bg-rose-700"
              aria-label="Say the word"
            >
              🎤
            </button>
          )}
          {st === "nothing" && speech.misses >= 2 && (
            <div>
              <button type="button" onClick={() => onAnswer(false)} className="mt-3 text-sm text-stone-500 underline">
                Skip this word
              </button>
            </div>
          )}
          {st === "listening" && (
            <button
              type="button"
              onClick={speech.stop}
              className={`mt-4 inline-flex size-20 items-center justify-center rounded-full text-4xl text-white shadow ${speech.hearing ? "animate-pulse bg-emerald-500" : "animate-pulse bg-rose-500"}`}
              aria-label="Done speaking"
            >
              👂
            </button>
          )}
          {st === "wrong" && (
            <div className="mt-4">
              {speech.heard && (
                <p className="text-sm text-stone-500">
                  I heard: <span dir="rtl" lang="he" className="font-hebrew text-lg">{speech.heard}</span>
                </p>
              )}
              <p className="text-lg font-semibold text-rose-700">
                {finalWrong ? "Not quite. Listen to the Hazzan, and you'll get it next time." : "Not quite. Listen to the Hazzan, then try again."}
              </p>
              {canHear && (
                <button
                  type="button"
                  onClick={() => play(word)}
                  className="mt-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2 font-semibold text-amber-900 hover:bg-amber-100"
                >
                  🔊 The Hazzan
                </button>
              )}
            </div>
          )}
          {st === "right" && <p className="mt-4 text-lg font-semibold text-emerald-700">Right! You said it! 🎉</p>}
          {(st === "right" || finalWrong) && (
            <div>
              <button
                type="button"
                onClick={() => onAnswer(st === "right")}
                className="mt-4 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
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
