"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { openLetters, sameSound, type Letter } from "@/data/beginner";
import { beginnerRecording } from "@/data/beginner-recordings";
import { recordingUrl } from "@/lib/recordings";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { shuffle } from "./WordQuestion";

/**
 * The letter trainer, for the letters the teacher has opened so far:
 *  - sound → letter: hear a letter's sound, tap the letter(s) that make it. When two
 *    letters make the same sound (Samekh and Sin, Tet and Tav, Vet and Vav), tap both.
 *  - letter → sound: see a letter, tap the sound (of three) it makes.
 *  - name → letter: hear a letter's name, tap the letter (Alef and He have no sound
 *    alone, so they're asked by name).
 */
type Kind = "sound" | "letter" | "name";
const ROUND = 10;
const LABEL: Record<Kind, string> = {
  sound: "Which letter makes this sound?",
  letter: "Which sound does this letter make?",
  name: "Which letter is this?",
};
const hasAlone = (l: Letter) => l.id !== "alef" && l.id !== "he";
const aloneRec = (l: Letter) => beginnerRecording(`sound:${l.id}:alone`) ?? `/audio/beginner/${l.id}-alone.mp3`;
const nameRec = (l: Letter) => `/audio/beginner/letter-${l.id}.mp3`;
export const lettersKey = (n: number) => `beginner-letters:${n}`;
export const letterQuizKey = (id: string) => `beginner-letter:${id}`;

interface Question {
  kind: Kind;
  letter: Letter;
  /** For "sound" and "name": the letters to choose from. For "letter": the letters whose sounds are offered. */
  options: Letter[];
}

function makeRound(open: Letter[]): Question[] {
  const withSound = open.filter(hasAlone);
  const distinctSounds = new Set(withSound.map((l) => l.sym)).size;
  const qs: Question[] = [];
  const order = shuffle(Array.from({ length: ROUND }, (_, i) => open[i % open.length]));
  for (const letter of order) {
    const kinds: Kind[] = ["name"];
    if (hasAlone(letter) && withSound.length >= 2) kinds.push("sound", "sound");
    if (hasAlone(letter) && distinctSounds >= 2) kinds.push("letter", "letter");
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    let options: Letter[];
    if (kind === "letter") {
      // Three letters with different sounds, one of them this letter.
      const others = shuffle(withSound.filter((l) => l.sym !== letter.sym));
      const picked: Letter[] = [];
      for (const o of others) if (!picked.some((p) => p.sym === o.sym) && picked.length < 2) picked.push(o);
      options = shuffle([letter, ...picked]);
    } else {
      // Up to 6 letters to tap, always including every letter with the same sound.
      const right = kind === "sound" ? sameSound(letter, open) : [letter];
      const pool = kind === "sound" ? withSound : open;
      const rest = shuffle(pool.filter((l) => !right.includes(l))).slice(0, Math.max(0, 6 - right.length));
      options = shuffle([...right, ...rest]);
    }
    qs.push({ kind, letter, options });
  }
  return qs;
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

async function play(paths: string[], setPlaying: (b: boolean) => void) {
  unlockAudio();
  setPlaying(true);
  try {
    const urls = await Promise.all(paths.map((p) => recordingUrl(p)));
    await playUrls(urls).done;
  } catch {
    // nothing to play
  } finally {
    setPlaying(false);
  }
}

function QuestionCard({ q, onDone }: { q: Question; onDone: (right: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const right = q.kind === "letter" ? [q.letter] : q.kind === "sound" ? sameSound(q.letter, q.options) : [q.letter];
  const multi = right.length > 1;
  const isRight = checked && picked.length === right.length && right.every((r) => picked.includes(r.id));
  const prompt = q.kind === "name" ? nameRec(q.letter) : aloneRec(q.letter);

  useEffect(() => {
    if (q.kind !== "letter") void play([prompt], setPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    if (checked) return;
    if (!multi) return setPicked([id]);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };
  const tone = (l: Letter) => {
    const sel = picked.includes(l.id);
    const ok = right.some((r) => r.id === l.id);
    if (!checked) return sel ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300" : "border-stone-200 bg-white hover:bg-amber-50";
    if (ok) return "border-emerald-400 bg-emerald-50";
    return sel ? "border-rose-400 bg-rose-50" : "border-stone-200 bg-white opacity-50";
  };

  return (
    <div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">{LABEL[q.kind]}</p>
      {q.kind === "letter" ? (
        <>
          <p dir="rtl" lang="he" className="mt-4 font-hebrew text-8xl leading-none text-stone-900">
            {q.letter.char}
          </p>
          <p className="mt-3 text-stone-600">Tap each sound to hear it, then choose.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {q.options.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  void play([aloneRec(l)], setPlaying);
                  toggle(l.id);
                }}
                className={`rounded-2xl border-2 p-4 transition-colors ${tone(l)}`}
              >
                <span className="text-3xl">🔊</span>
                <span className="mt-1 block text-sm font-semibold text-stone-700">Sound {i + 1}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => play([prompt], setPlaying)}
            className={`mt-5 inline-flex size-20 items-center justify-center rounded-full bg-amber-600 text-4xl text-white shadow hover:bg-amber-700 ${playing ? "animate-pulse" : ""}`}
            aria-label="Hear it again"
          >
            🔊
          </button>
          <p className="mt-2 text-stone-600">
            {multi ? (
              <>
                <b>More than one letter</b> makes this sound. Tap all of them.
              </>
            ) : (
              "Tap the letter."
            )}
          </p>
          <div dir="rtl" className="mt-4 grid grid-cols-3 gap-3">
            {q.options.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => toggle(l.id)}
                className={`rounded-2xl border-2 py-4 font-hebrew text-6xl leading-none transition-colors ${tone(l)}`}
                aria-label={l.name}
              >
                {l.char}
              </button>
            ))}
          </div>
        </>
      )}
      {!checked ? (
        <button
          type="button"
          disabled={!picked.length}
          onClick={() => setChecked(true)}
          className="mt-5 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-40"
        >
          {picked.length ? "Check" : multi ? "Tap all the letters" : "Choose one"}
        </button>
      ) : (
        <div className="mt-5">
          <p className={`text-lg font-semibold ${isRight ? "text-emerald-700" : "text-rose-700"}`}>
            {isRight
              ? "Right! 🎉"
              : multi
                ? `Both ${right.map((r) => r.name).join(" and ")} make this sound.`
                : `That's ${q.letter.name}. The green one is right.`}
          </p>
          <button
            type="button"
            onClick={() => onDone(isRight)}
            className="mt-3 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export function LetterTrainer() {
  const { beginnerLevel, lettersOpen } = useAuth();
  const open = useMemo(() => openLetters(lettersOpen, beginnerLevel), [lettersOpen, beginnerLevel]);
  const best = useBest();
  const [round, setRound] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const key = lettersKey(open.length);
  const newest = open[open.length - 1];

  const start = () => {
    unlockAudio();
    setRound(makeRound(open));
    setI(0);
    setScore(0);
    setDone(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <span className="text-sm text-stone-600">Letters you know:</span>
        <span dir="rtl" lang="he" className="font-hebrew text-2xl text-stone-900">
          {open.map((l) => l.char).join(" ")}
        </span>
        <div className="ms-auto">
          <SpeedControl compact />
        </div>
      </div>

      {open.length < 2 ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p dir="rtl" lang="he" className="font-hebrew text-8xl leading-none text-stone-900">
            {newest.char}
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-900">This is {newest.name}.</p>
          <p className="mt-1 text-stone-600">
            {newest.id === "alef" ? "Alef has no sound by itself. " : ""}The trainer starts when your teacher opens the next letter.
          </p>
          <Link href="/beginner/letters/" className="mt-4 inline-block font-semibold text-amber-800 underline">
            ← The Alef-Bet
          </Link>
        </div>
      ) : !round ? (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-700">
            {ROUND} questions on the letters you know. Newest letter: <b>{newest.name}</b>{" "}
            <span dir="rtl" lang="he" className="font-hebrew text-2xl">
              {newest.char}
            </span>
          </p>
          {best[key] !== undefined && <p className="mt-1 text-sm text-amber-700">Best: {best[key]}%</p>}
          <button type="button" onClick={start} className="mt-4 rounded-xl bg-amber-700 px-6 py-3 text-lg font-semibold text-white hover:bg-amber-800">
            Start ▶
          </button>
        </div>
      ) : done ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-5xl">{score >= 9 ? "🌟" : score >= 7 ? "⭐" : "👍"}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {score} of {round.length} right
          </p>
          <button type="button" onClick={start} className="mt-4 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800">
            Again
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              Question {i + 1} of {round.length}
            </span>
            <span>{score} right</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * i) / round.length}%` }} />
          </div>
          <QuestionCard
            key={i}
            q={round[i]}
            onDone={(ok) => {
              recordQuiz(letterQuizKey(round[i].letter.id), ok);
              const s = score + (ok ? 1 : 0);
              setScore(s);
              if (i + 1 >= round.length) {
                recordPractice(key, Math.round((100 * s) / round.length));
                setDone(true);
              } else setI(i + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
