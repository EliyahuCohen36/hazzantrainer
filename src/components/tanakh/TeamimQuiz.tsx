"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PROSE_TEAMIM, type TaamReference } from "@/data/teamim-reference";
import { TORAH_TEAMIM_RECORDINGS } from "@/data/teamim-recordings";
import { useRecordingUrl } from "@/lib/recordings";
import { recordQuiz } from "@/lib/audio/taam-practice";

const ROUND = 10;

/** Te'amim that are easy to mix up: one of them is offered as a wrong answer when possible. */
const LOOKALIKES: string[][] = [
  ["talsha", "tilsa"],
  ["kadma", "tere-kadmin", "yetib"],
  ["zakef-katon", "zakef-gadol"],
  ["gerish", "shene-gerishin"],
  ["shofar-holekh-pesik", "shofar-mehuppakh", "darga"],
  ["atnah", "tarha", "sof-pasuk"],
  ["rebia", "zarka", "segolta"],
];

/** Signs that look the same on one letter (they differ only in position in the word): never offered together. */
const SAME_LOOK: string[][] = [["yetib", "shofar-mehuppakh"]];
const looksSame = (a: string, b: string) => SAME_LOOK.some((g) => g.includes(a) && g.includes(b));

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

interface Question {
  answer: TaamReference;
  choices: TaamReference[];
}

function makeRound(pool: TaamReference[]): Question[] {
  const order = shuffle(pool);
  const qs: Question[] = [];
  for (let i = 0; i < ROUND; i++) {
    const answer = order[i % order.length];
    const others = pool.filter((t) => t.id !== answer.id && !looksSame(t.id ?? "", answer.id ?? ""));
    const look = LOOKALIKES.find((g) => g.includes(answer.id ?? ""));
    const tricky = shuffle(others.filter((t) => look?.includes(t.id ?? ""))).slice(0, 1);
    const chosen = [answer, ...tricky];
    for (const t of shuffle(others.filter((t) => !tricky.includes(t)))) {
      if (chosen.length >= 4) break;
      if (!chosen.some((c) => looksSame(c.id ?? "", t.id ?? ""))) chosen.push(t);
    }
    qs.push({ answer, choices: shuffle(chosen) });
  }
  return qs;
}

/** Listening quiz: hear the Hazzan sing a ta'am, pick its name. */
export function TeamimQuiz() {
  const pool = useMemo(() => PROSE_TEAMIM.filter((t) => t.id && TORAH_TEAMIM_RECORDINGS[t.id]), []);
  const [round, setRound] = useState<Question[]>([]);
  const [n, setN] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [missed, setMissed] = useState<TaamReference[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setRound(makeRound(pool)), [pool]);

  const q = round[n];
  const done = round.length > 0 && n >= round.length;
  const quizUrl = useRecordingUrl(q ? TORAH_TEAMIM_RECORDINGS[q.answer.id ?? ""] : null);

  const play = () => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play().catch(() => {});
  };

  const choose = (t: TaamReference) => {
    if (picked || !q) return;
    setPicked(t.id ?? "");
    const ok = t.id === q.answer.id;
    if (ok) setRight((r) => r + 1);
    else setMissed((m) => (m.some((x) => x.id === q.answer.id) ? m : [...m, q.answer]));
    recordQuiz(q.answer.id ?? "", ok);
  };

  const next = () => {
    setPicked(null);
    setN((x) => x + 1);
  };

  const restart = () => {
    setRound(makeRound(pool));
    setN(0);
    setPicked(null);
    setRight(0);
    setMissed([]);
  };

  if (pool.length < 4) return <p className="text-stone-500">The quiz starts once there are at least 4 recordings.</p>;
  if (!round.length) return null;

  if (done) {
    const stars = right >= 9 ? 3 : right >= 7 ? 2 : right >= 4 ? 1 : 0;
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <div className="text-5xl tracking-wider text-amber-500">
          {"★".repeat(stars)}
          <span className="text-stone-300">{"★".repeat(3 - stars)}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold text-stone-900">
          {right} out of {round.length}
        </p>
        <p className="text-stone-600">
          {stars === 3 ? "Excellent! You know your te'amim." : stars === 2 ? "Very good!" : "Good practice. Try another round!"}
        </p>
        {missed.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="text-stone-500">Listen again to:</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {missed.map((t) => (
                <Link
                  key={t.id}
                  href={`/tanakh/torah/teamim/#${t.id}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-amber-900 hover:bg-amber-200"
                >
                  {t.syrian}
                </Link>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={restart}
          className="mt-5 rounded-full bg-amber-700 px-6 py-2 font-medium text-white hover:bg-amber-800"
        >
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          Question {n + 1} of {round.length}
        </span>
        <span>
          Score <b className="tabular-nums text-stone-800">{right}</b>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-stone-100">
        <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{ width: `${(n / round.length) * 100}%` }} />
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <audio ref={audio} src={quizUrl ?? undefined} preload="auto" />
        <button
          type="button"
          onClick={play}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-700 text-3xl text-white shadow-md hover:bg-amber-800"
          aria-label="Listen"
        >
          ▶
        </button>
        <p className="text-stone-600">Listen to the Hazzan. Which sign is it?</p>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {q.choices.map((t) => {
          const isAnswer = t.id === q.answer.id;
          const isPicked = t.id === picked;
          const state = !picked ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "dim";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t)}
              disabled={!!picked}
              aria-label={picked ? t.syrian : `Choice ${q.choices.indexOf(t) + 1}`}
              className={`flex min-h-24 items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition ${
                state === "idle"
                  ? "bg-white ring-stone-200 hover:bg-amber-50 hover:ring-amber-300"
                  : state === "right"
                    ? "bg-emerald-50 ring-2 ring-emerald-500"
                    : state === "wrong"
                      ? "bg-rose-50 ring-2 ring-rose-400"
                      : "bg-white opacity-50 ring-stone-200"
              }`}
            >
              {/* Only the sign until the child answers: the Hazzan sings the name, so names would give it away. */}
              <span
                dir="rtl"
                lang="he"
                className={`hebrew-text text-center font-hebrew leading-[1.6] text-amber-800 ${picked ? "w-16 text-4xl" : "flex-1 text-5xl"}`}
              >
                {t.sample}
              </span>
              {picked && (
                <span>
                  <span className="block font-semibold text-stone-900">{t.syrian}</span>
                  <span dir="rtl" lang="he" className="block font-hebrew text-sm text-stone-500">
                    {t.hebrew}
                  </span>
                </span>
              )}
              {state === "right" && <span className="ms-auto text-xl text-emerald-600">✓</span>}
              {state === "wrong" && <span className="ms-auto text-xl text-rose-500">✗</span>}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className={picked === q.answer.id ? "font-medium text-emerald-700" : "font-medium text-rose-600"}>
            {picked === q.answer.id ? "Right!" : `Not quite. That was ${q.answer.syrian}.`}{" "}
            <button type="button" onClick={play} className="text-sm text-amber-800 underline">
              Hear it again
            </button>
          </p>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-amber-700 px-6 py-2 font-medium text-white hover:bg-amber-800"
          >
            {n + 1 < round.length ? "Next →" : "See my score"}
          </button>
        </div>
      )}
    </div>
  );
}
