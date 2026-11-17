"use client";

import { useMemo, useState } from "react";
import { STRESS_KEY, STRESS_WORDS, type StressWord } from "@/data/stress-words";
import { WithMaamid } from "@/components/reader/Maamid";
import { recordPractice } from "@/lib/audio/taam-practice";
import { shuffleArray as shuffle } from "@/lib/audio/shuffle";

const PASS = 0.8;

function Word({ w, big = false }: { w: StressWord; big?: boolean }) {
  return (
    <span dir="rtl" lang="he" className={`hebrew-text font-hebrew ${big ? "text-6xl leading-[1.8]" : "text-3xl leading-[2]"} text-stone-900`}>
      <WithMaamid text={w.w} />
    </span>
  );
}

/** Level 1: where the stress goes, before learning any ta'am. */
export function MilelMilra() {
  const milel = STRESS_WORDS.filter((x) => x.type === "milel" && !x.pair);
  const milra = STRESS_WORDS.filter((x) => x.type === "milra" && !x.pair);
  const pairs = STRESS_WORDS.filter((x) => x.pair);
  const [quiz, setQuiz] = useState<StressWord[] | null>(null);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [answer, setAnswer] = useState<"milel" | "milra" | null>(null);
  const start = () => {
    setQuiz(shuffle(STRESS_WORDS));
    setI(0);
    setRight(0);
    setAnswer(null);
  };
  const q = quiz?.[i];
  const done = quiz && i >= quiz.length;
  const pct = useMemo(() => (quiz ? right / quiz.length : 0), [right, quiz]);

  return (
    <div className="mt-4 space-y-5">
      <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-stone-800">
        <p>
          Every word has one syllable that is said a little stronger: the stress. In our text a{" "}
          <b>ma&apos;amid</b> (the line under a letter) shows it. The te&apos;amim sit on that same letter, so you have to
          know where the stress is before you learn them.
        </p>
        <p>
          <b>Mil&apos;el</b> (מִלְעֵיל, &ldquo;from above&rdquo;): the stress is at the start or in the middle of the word,
          anywhere except the last syllable.
        </p>
        <p>
          <b>Milra</b> (מִלְרַע, &ldquo;from below&rdquo;): the stress is on the last syllable.
        </p>
        <p>
          This matters for the te&apos;amim: a Kadma is written at the end of the word, but when the word is Mil&apos;el a
          second Kadma shows where the stress really is; and a two-syllable word with Yetib is always Mil&apos;el (the
          stress on the first syllable).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 p-4">
          <h4 className="font-semibold text-stone-900">
            Mil&apos;el <span className="font-hebrew text-amber-800">מלעיל</span>
          </h4>
          <div className="mt-2 flex flex-wrap gap-x-5" dir="rtl">
            {milel.map((w) => (
              <Word key={w.w} w={w} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 p-4">
          <h4 className="font-semibold text-stone-900">
            Milra <span className="font-hebrew text-amber-800">מלרע</span>
          </h4>
          <div className="mt-2 flex flex-wrap gap-x-5" dir="rtl">
            {milra.map((w) => (
              <Word key={w.w} w={w} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 p-4">
        <h4 className="font-semibold text-stone-900">Same letters, different stress, different meaning</h4>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {["ba-a", "qama", "shavu"].map((id) => (
            <div key={id} className="rounded-lg bg-stone-50 p-3 text-sm">
              {pairs
                .filter((p) => p.pair === id)
                .map((p) => (
                  <div key={p.w} className="flex items-center justify-between gap-3">
                    <Word w={p} />
                    <span className="text-stone-600">
                      {p.type === "milel" ? "Mil'el" : "Milra"}: {p.means}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-300 p-4">
        {!quiz && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-700">
              Practice: {STRESS_WORDS.length} words. Look at the ma&apos;amid and say if the word is Mil&apos;el or Milra.
            </p>
            <button type="button" onClick={start} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
              Start ▶
            </button>
          </div>
        )}
        {q && !done && (
          <div className="text-center">
            <p className="text-xs text-stone-500">
              Question {i + 1} of {quiz!.length}
            </p>
            <div className="my-2">
              <Word w={q} big />
            </div>
            <div className="flex justify-center gap-3">
              {(["milel", "milra"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={!!answer}
                  onClick={() => {
                    setAnswer(t);
                    if (t === q.type) setRight((r) => r + 1);
                  }}
                  className={`min-w-32 rounded-xl border-2 px-4 py-3 text-lg font-semibold ${
                    answer && t === q.type
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : answer === t
                        ? "border-rose-400 bg-rose-50 text-rose-800"
                        : "border-stone-300 bg-white text-stone-800 hover:border-amber-400"
                  }`}
                >
                  {t === "milel" ? "Mil'el" : "Milra"}
                  <span className="block font-hebrew text-base font-normal">{t === "milel" ? "מלעיל" : "מלרע"}</span>
                </button>
              ))}
            </div>
            {answer && (
              <div className="mt-3">
                <p className={answer === q.type ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                  {answer === q.type
                    ? "Right!"
                    : q.type === "milel"
                      ? "Not quite: the ma'amid is before the last syllable, so it's Mil'el."
                      : "Not quite: the ma'amid is on the last syllable, so it's Milra."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const n = i + 1;
                    setI(n);
                    setAnswer(null);
                    if (n >= quiz!.length) recordPractice(STRESS_KEY, Math.round((100 * right) / quiz!.length));
                  }}
                  className="mt-2 rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
        {done && (
          <div className="text-center">
            <p className="text-2xl font-semibold text-stone-900">
              {right} of {quiz!.length}
            </p>
            <p className="mt-1 text-stone-700">
              {pct >= PASS ? "Level complete! You know Mil'el and Milra." : "Good practice. Try again to get 80% or more."}
            </p>
            <button type="button" onClick={start} className="mt-3 rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
              Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
