"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import words from "@/data/sheva-words.json";
import { CHOICE_LABELS, PART_TITLES, SHEVA_PASS, SHEVA_QUESTIONS, SHEVA_STAGES, shevaStageKey, type ShevaStage, type StagePart } from "@/data/sheva-stages";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { shuffleArray as shuffle } from "@/lib/audio/shuffle";

interface Item {
  w: string;
  /** Index of the letter to look at. */
  i: number;
  a: string;
  k: string;
  /** The right reading and the wrong ones, in Latin syllables (not on "choice" items). */
  r?: string;
  x?: string;
  y?: string;
}
const WORDS = words as unknown as Record<string, Item[]>;
const PASS_PCT = Math.round((100 * SHEVA_PASS) / SHEVA_QUESTIONS);

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

/** The word with the letter to look at highlighted, and a ma'amid drawn as a line. No bold hints: the child works it out. */
export function ShevaWord({ item, big = true }: { item: Item; big?: boolean }) {
  const parts: { t: string; meteg: boolean }[] = [];
  for (const ch of item.w) {
    if (ch >= "א" && ch <= "ת") parts.push({ t: ch, meteg: false });
    else if (parts.length) {
      if (ch === "ֽ") parts[parts.length - 1].meteg = true;
      else parts[parts.length - 1].t += ch;
    } else parts.push({ t: ch, meteg: false });
  }
  return (
    <span dir="rtl" lang="he" className={`hebrew-text font-hebrew ${big ? "text-6xl leading-[1.9]" : "text-2xl"} text-stone-900`}>
      {parts.map((p, k) => (
        <span key={k} className={`${p.meteg ? "maamid" : ""} ${k === item.i ? "rounded bg-amber-200 px-0.5" : ""}`}>
          {p.t}
        </span>
      ))}
    </span>
  );
}

const REASON: Record<string, string> = {
  "nach-patah": "after a Patah: Nach",
  "nach-segol": "after a Segol: Nach",
  "nach-hiriq": "after a Hiriq without Yod: Nach",
  "nach-katan": "after a Qamats Katan: Nach",
  "nach-qibbus": "after a Qibbus: Nach",
  "na-qamats": "after a Qamats: Na",
  "na-tsere": "after a Tsere: Na",
  "na-hiriq": "after a Hiriq Male: Na",
  "na-holam": "after a Holam: Na",
  "na-shuruk": "after a Shuruq in the middle: Na",
  "nach-u": "after וּ at the start: Nach",
  end: "at the end of the word: Nach",
  "na-start": "on the first letter: Na",
  "two-middle": "the second of two Shevas: Na",
  "katan-sheva": "no ma'amid, before a Sheva: Qamats Katan, \"o\"",
  "gadol-sheva": "a ma'amid under it: Qamats Gadol, \"a\"",
  "katan-maqaf": "before a Maqaf: Qamats Katan, \"o\"",
  "na-dagesh": "a Sheva with a Dagesh: Na",
  "genuva-w": "after \"o\" or \"u\": a \"w\" sound",
  "genuva-y": "after \"e\" or \"i\": a \"y\" sound",
  "dagesh-kal": "at the start of the word: Dagesh Kal",
  "dagesh-hazaq": "after a short vowel: Dagesh Hazaq",
  "he-yediah": "\"the\": He HaYedi'ah",
  "he-sheelah": "a question: He HaShe'elah",
  "he-megamah": "\"towards\": He HaMegamah",
  "he-mappiq": "a dot in the He, \"her\": Mappiq He",
};

/** What the child is asked, by step. */
const PROMPT: Partial<Record<StagePart, string>> = {
  katan: "Look at the highlighted Qamats. How do you read the word?",
  genuva: "Look at the last letter. How do you read the word?",
  dagesh: "Look at the highlighted letter.",
  he: "Look at the highlighted ה. Which He is it?",
};

/** The answer, said in words after the child picks. */
function answerName(stage: ShevaStage, q: Item) {
  if (q.a === "na") return "Sheva Na";
  if (q.a === "nach") return "Sheva Nach";
  if (q.a === "o") return "Qamats Katan";
  if (q.a === "a") return "Qamats Gadol";
  if (q.a === "w" || q.a === "y") return "Patah Genuva";
  if (CHOICE_LABELS[q.a]) return CHOICE_LABELS[q.a].en;
  return "";
}

function makeQuestions(stage: ShevaStage): Item[] {
  const pool = stage.from.flatMap((k) => WORDS[k] ?? []);
  const out: Item[] = [];
  while (out.length < SHEVA_QUESTIONS && pool.length) out.push(...shuffle(pool));
  return out.slice(0, SHEVA_QUESTIONS);
}

/**
 * Reading-rule practice (Sheva, Qamats Katan, Patah Genuva, Dagesh, the four He): 50 words a step,
 * pass 40 to open the next step. `parts` picks which steps this page shows.
 */
export function ShevaTrainer({ parts }: { parts?: StagePart[] }) {
  const { beginnerLevel, profile } = useAuth();
  const free = profile?.role === "teacher" || profile?.role === "admin";
  const best = useBest();
  const passed = (s: ShevaStage) => (best[shevaStageKey(s.id)] ?? 0) >= PASS_PCT;
  const isOpen = (i: number) => beginnerLevel >= SHEVA_STAGES[i].level && (free || i === 0 || passed(SHEVA_STAGES[i - 1]));

  const [stage, setStage] = useState<ShevaStage | null>(null);
  const [qs, setQs] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const q = qs[i];
  const options = useMemo(() => {
    if (!q || !stage) return [];
    if (stage.ask === "choice") return stage.choices ?? [];
    const wrong = (stage.wrong ?? ["x"]).map((k) => q[k]).filter((x): x is string => !!x && x !== q.r);
    return shuffle([q.r!, ...Array.from(new Set(wrong))]);
  }, [q, stage]);
  const rightAnswer = stage?.ask === "choice" ? q?.a : q?.r;

  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const k = SHEVA_STAGES.findIndex((s) => s.id === id);
    if (k >= 0) document.getElementById(`stage-${id}`)?.scrollIntoView({ block: "center" });
  }, []);

  const start = (s: ShevaStage) => {
    setStage(s);
    setQs(makeQuestions(s));
    setI(0);
    setRight(0);
    setPicked(null);
    setDone(null);
    window.scrollTo({ top: 0 });
  };

  if (stage && done !== null) {
    const ok = done >= PASS_PCT;
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-stone-500">{stage.title}</p>
        <p className="mt-2 text-4xl font-semibold text-stone-900">{done}%</p>
        <p className="mt-2 text-stone-700">{ok ? "Step passed! The next step is open." : `Get ${SHEVA_PASS} of ${SHEVA_QUESTIONS} to pass. Try again!`}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={() => start(stage)} className="rounded-lg border border-amber-600 px-4 py-2 font-semibold text-amber-800">
            Again
          </button>
          <button type="button" onClick={() => setStage(null)} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
            All steps
          </button>
        </div>
      </div>
    );
  }

  if (stage && q) {
    const isSheva = q.a === "na" || q.a === "nach";
    const correct = picked === rightAnswer;
    const choice = stage.ask === "choice";
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm text-stone-500">
          <button type="button" onClick={() => setStage(null)} className="text-amber-800 hover:underline">
            ← All steps
          </button>
          <span>
            Question {i + 1} of {qs.length} · {right} right
          </span>
        </div>
        <p className="mt-2 text-center text-sm font-medium text-stone-700">
          {isSheva
            ? "Look at the highlighted Sheva. How do you read the word?"
            : (PROMPT[stage.part] ?? "Look at the highlighted Qamats. How do you read the word?")}
        </p>
        <div className="my-3 text-center">
          <ShevaWord item={q} />
        </div>
        <div className={`mx-auto grid max-w-md gap-2 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              disabled={!!picked}
              onClick={() => {
                setPicked(o);
                const ok = o === rightAnswer;
                if (ok) setRight((r) => r + 1);
                recordQuiz(`beginner-sheva-rule:${q.k}`, ok);
              }}
              className={`rounded-xl border-2 px-4 py-3 font-semibold ${choice ? "text-base" : "text-xl tracking-wide"} ${
                picked && o === rightAnswer
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : picked === o
                    ? "border-rose-400 bg-rose-50 text-rose-800"
                    : "border-stone-300 bg-white text-stone-800 hover:border-amber-400"
              }`}
              dir={choice ? undefined : "ltr"}
            >
              {choice ? (
                <>
                  <span className="block">{CHOICE_LABELS[o]?.en ?? o}</span>
                  <span dir="rtl" lang="he" className="block font-hebrew text-lg text-amber-800">
                    {CHOICE_LABELS[o]?.he}
                  </span>
                </>
              ) : (
                o
              )}
            </button>
          ))}
        </div>
        {picked && (
          <div className="mt-4 text-center">
            <p className={correct ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
              {correct ? "Right!" : "Not quite."} {answerName(stage, q)}
              {REASON[q.k] ? ` (${REASON[q.k]})` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                const n = i + 1;
                setPicked(null);
                if (n >= qs.length) {
                  const score = Math.round((100 * (right + 0)) / qs.length);
                  recordPractice(shevaStageKey(stage.id), score);
                  setDone(score);
                } else setI(n);
              }}
              className="mt-3 rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  }

  // The steps, in parts.
  let lastPart = "";
  return (
    <div>
      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        Each step is <b>{SHEVA_QUESTIONS} words</b>. Get at least <b>{SHEVA_PASS} right</b> to open the next step.
      </p>
      <ol className="grid gap-3">
        {SHEVA_STAGES.map((s, k) => {
          if (parts && !parts.includes(s.part)) return null;
          const num = SHEVA_STAGES.slice(0, k + 1).filter((x) => !parts || parts.includes(x.part)).length;
          const ok = isOpen(k);
          const b = best[shevaStageKey(s.id)];
          const head = s.part !== lastPart;
          lastPart = s.part;
          return (
            <li key={s.id} id={`stage-${s.id}`}>
              {head && <h2 className="mt-4 mb-2 text-lg font-semibold text-stone-900">{PART_TITLES[s.part]}</h2>}
              <div className={`rounded-2xl border p-4 shadow-sm ${ok ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-50"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className={`font-semibold ${ok ? "text-stone-900" : "text-stone-400"}`}>
                    {!ok && "🔒 "}
                    {num}. {ok ? s.title : `Step ${num}`}
                  </h3>
                  {ok && (
                    <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
                      {s.he}
                    </span>
                  )}
                </div>
                {ok ? (
                  <>
                    <p className="mt-1 text-sm text-stone-700">{s.rule}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => start(s)} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
                        {b !== undefined ? "Again" : "Start ▶"}
                      </button>
                      {b !== undefined && (
                        <span className={`text-sm font-medium ${b >= PASS_PCT ? "text-emerald-700" : "text-stone-500"}`}>
                          Best: {b}% {b >= PASS_PCT ? "✓" : ""}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-stone-500">
                    {beginnerLevel < s.level ? "Your teacher will open this when you're ready." : "Pass the step before to open this one."}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
