"use client";

import { useEffect, useState } from "react";
import { BEGINNER_DEMO_WORDS } from "@/data/demo";
import { WordQuestion, QUESTION_LABEL, shuffle, type QuestionType } from "./WordQuestion";

const TYPES: QuestionType[] = ["listen", "sound", "say", "listen", "sound", "say"];

/** A short taste of Beginner Keriah word practice for the free demo (not saved). */
export function BeginnerDemo() {
  // Shuffled after the page loads (shuffling while the page is built would differ from the browser's).
  const [order, setOrder] = useState(BEGINNER_DEMO_WORDS.slice(0, TYPES.length));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setOrder(shuffle(BEGINNER_DEMO_WORDS).slice(0, TYPES.length));
    setReady(true);
  }, []);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const done = i >= order.length;
  if (!ready) return <div className="h-96 rounded-3xl border border-stone-200 bg-white shadow-sm" />;
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
      {!done ? (
        <>
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>
              Word {i + 1} of {order.length}
            </span>
            <span>{right} right</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * i) / order.length}%` }} />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">{QUESTION_LABEL[TYPES[i]]}</p>
          <WordQuestion
            key={i}
            word={order[i]}
            type={TYPES[i]}
            pool={BEGINNER_DEMO_WORDS}
            onAnswer={(ok) => {
              if (ok) setRight((r) => r + 1);
              setI((n) => n + 1);
            }}
          />
        </>
      ) : (
        <div className="py-4">
          <p className="text-5xl">🎉</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {right} of {order.length} right!
          </p>
          <p className="mt-1 text-stone-600">
            With a subscription, children go step by step through every nekuda, 50 words at a time, with stars.
          </p>
          <button
            type="button"
            onClick={() => {
              setOrder(shuffle(BEGINNER_DEMO_WORDS).slice(0, TYPES.length));
              setI(0);
              setRight(0);
            }}
            className="mt-4 rounded-xl border border-stone-300 bg-white px-5 py-2.5 font-semibold text-stone-800 hover:bg-stone-50"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
