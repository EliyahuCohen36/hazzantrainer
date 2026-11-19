"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LETTERS } from "@/data/beginner";
import { GLYPHS, LEARN_PASS, LETTER_LESSONS, SCRIPT_LESSON, learnKey, type LetterLesson, type LessonGlyph } from "@/data/letter-lessons";
import { LETTER_STROKES, checkDrawing, DRAW_PASS, type Stroke } from "@/data/letter-strokes";
import { beginnerPlaylist } from "@/data/beginner-recordings";
import { recordingUrl } from "@/lib/recordings";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { shuffleArray as shuffle } from "@/lib/audio/shuffle";
import { Tile } from "./Tile";

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

/** Plays a letter's name (and sound) if the Hazzan has recorded it. */
async function playLetter(id: string) {
  const list = beginnerPlaylist(`letter:${id}`);
  if (!list.length) return;
  unlockAudio();
  const urls = await Promise.all(list.map((p) => recordingUrl(p)));
  await playUrls(urls, 0.35).done;
}

// ─────────────────────────────────────────────── drawing

/** Shows how the letter is written: each stroke drawn in turn, with its number at the start. */
function WriteDemo({ strokes }: { strokes: Stroke[] }) {
  const [run, setRun] = useState(0);
  return (
    <div className="text-center">
      <svg key={run} viewBox="-5 -5 110 110" className="mx-auto size-56 rounded-2xl border border-stone-200 bg-white">
        <line x1="0" y1="85" x2="100" y2="85" stroke="#e7e5e4" strokeWidth="0.8" />
        {strokes.map((s, i) => {
          const d = s.length === 1 ? `M${s[0][0]} ${s[0][1]} l0.01 0` : `M${s.map((p) => p.join(" ")).join(" L")}`;
          return (
            <g key={i}>
              <path
                d={d}
                fill="none"
                stroke="#78350f"
                strokeWidth={s.length === 1 ? 9 : 7}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
                style={{ animation: `write-stroke 0.9s ease-in-out ${i * 1.1}s forwards` }}
              />
              <circle cx={s[0][0]} cy={s[0][1]} r="4.5" fill="#f59e0b" opacity="0.9" />
              <text x={s[0][0]} y={s[0][1] + 2.2} fontSize="6" textAnchor="middle" fill="white" fontWeight="700">
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <button type="button" onClick={() => setRun((r) => r + 1)} className="mt-2 text-sm font-semibold text-amber-800 underline">
        ↻ Watch again
      </button>
    </div>
  );
}

/** A pad to draw the letter on, with or without the letter faintly underneath. Calls onPass when it's good. */
function DrawPad({ strokes, guide, numbers = true, onPass }: { strokes: Stroke[]; guide: boolean; numbers?: boolean; onPass: () => void }) {
  const [ink, setInk] = useState<[number, number][][]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drawing = useRef(false);
  const at = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 110 - 5, ((e.clientY - r.top) / r.height) * 110 - 5] as [number, number];
  };
  const check = () => {
    const { coverage, accuracy } = checkDrawing(strokes, ink, 7, false);
    if (coverage >= DRAW_PASS.coverage && accuracy >= DRAW_PASS.accuracy) {
      setMsg({ ok: true, text: "Beautiful! 🎉" });
      setTimeout(onPass, 900);
    } else if (coverage < DRAW_PASS.coverage) setMsg({ ok: false, text: "Some of the letter is missing. Try again!" });
    else setMsg({ ok: false, text: "Stay on the letter's lines. Try again!" });
  };
  return (
    <div className="text-center">
      <svg
        ref={svg}
        viewBox="-5 -5 110 110"
        className="mx-auto size-72 touch-none rounded-2xl border-2 border-amber-300 bg-white sm:size-80"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drawing.current = true;
          setMsg(null);
          setInk((k) => [...k, [at(e)]]);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = at(e);
          setInk((k) => {
            const c = k.slice();
            c[c.length - 1] = [...c[c.length - 1], p];
            return c;
          });
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      >
        <line x1="0" y1="85" x2="100" y2="85" stroke="#e7e5e4" strokeWidth="0.8" />
        {guide &&
          strokes.map((s, i) => (
            <g key={i}>
              <path
                d={s.length === 1 ? `M${s[0][0]} ${s[0][1]} l0.01 0` : `M${s.map((p) => p.join(" ")).join(" L")}`}
                fill="none"
                stroke="#e7e5e4"
                strokeWidth={s.length === 1 ? 10 : 12}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {numbers && (
                <>
                  <circle cx={s[0][0]} cy={s[0][1]} r="4" fill="#fbbf24" />
                  <text x={s[0][0]} y={s[0][1] + 2} fontSize="5.5" textAnchor="middle" fill="white" fontWeight="700">
                    {i + 1}
                  </text>
                </>
              )}
            </g>
          ))}
        {ink.map((s, i) => (
          <polyline
            key={i}
            points={s.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="#1c1917"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="mt-3 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setInk([]);
            setMsg(null);
          }}
          className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700"
        >
          Clear
        </button>
        <button type="button" onClick={check} disabled={!ink.length} className="rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white disabled:opacity-50">
          Check ✓
        </button>
      </div>
      {msg && <p className={`mt-2 text-lg font-semibold ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.text}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────── questions

interface Q {
  kind: "which-letter" | "which-name";
  answer: LessonGlyph;
  options: LessonGlyph[];
}

function Quiz({ questions, pass, onDone }: { questions: Q[]; pass: number; onDone: (right: number) => void }) {
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[i];
  useEffect(() => {
    if (q?.kind === "which-letter") playLetter(q.answer.id).catch(() => {});
  }, [q]);
  if (!q) return null;
  const ok = picked === q.answer.id;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
      <p className="text-sm text-stone-500">
        Question {i + 1} of {questions.length} · {right} right
      </p>
      {q.kind === "which-letter" ? (
        <p className="mt-2 text-xl font-semibold text-stone-900">
          Which one is <span className="text-amber-800">{q.answer.name}</span>?{" "}
          <button type="button" onClick={() => playLetter(q.answer.id)} aria-label="Hear it" className="align-middle text-2xl">
            🔊
          </button>
        </p>
      ) : (
        <>
          <p className="mt-2 text-xl font-semibold text-stone-900">What is this letter called?</p>
          <p dir="rtl" lang="he" className="my-2 font-hebrew text-8xl leading-tight text-stone-900">
            {q.answer.char}
          </p>
        </>
      )}
      <div className={`mx-auto mt-4 grid max-w-lg gap-3 ${q.options.length === 4 ? "grid-cols-2 sm:grid-cols-4" : q.options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={!!picked}
            onClick={() => {
              setPicked(o.id);
              const good = o.id === q.answer.id;
              if (good) setRight((r) => r + 1);
              recordQuiz(`beginner-letter:${q.answer.id}`, good);
            }}
            className={`rounded-2xl border-2 px-3 py-3 font-semibold ${
              picked && o.id === q.answer.id
                ? "border-emerald-500 bg-emerald-50"
                : picked === o.id
                  ? "border-rose-400 bg-rose-50"
                  : "border-stone-200 bg-white hover:border-amber-400"
            }`}
          >
            {q.kind === "which-letter" ? (
              <span dir="rtl" lang="he" className="font-hebrew text-6xl leading-tight">
                {o.char}
              </span>
            ) : (
              <span className="text-lg">{o.name}</span>
            )}
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-4">
          <p className={`text-lg font-semibold ${ok ? "text-emerald-700" : "text-rose-700"}`}>
            {ok ? "Right! 🎉" : `Not quite. That one is ${q.answer.name}: ${q.answer.char}`}
          </p>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              if (i + 1 >= questions.length) onDone(right);
              else setI(i + 1);
            }}
            className="mt-3 rounded-full bg-amber-700 px-6 py-2.5 text-lg font-semibold text-white"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/** Questions on one letter, with the letters learned before it as the wrong answers. */
function letterQuestions(g: LessonGlyph, known: LessonGlyph[], n = 5): Q[] {
  const others = known.filter((k) => k.id !== g.id && k.char !== g.char);
  const pool = others.length >= 3 ? others : [...others, ...[...GLYPHS.values()].filter((x) => x.id !== g.id && !others.includes(x))];
  return Array.from({ length: n }, (_, k) => {
    const kind: Q["kind"] = k % 2 === 0 ? "which-letter" : "which-name";
    const wrong = shuffle(pool).slice(0, kind === "which-letter" ? 3 : 2);
    return { kind, answer: g, options: shuffle([g, ...wrong]) };
  });
}

/** Questions telling two look-alike letters apart. */
function pairQuestions(a: LessonGlyph, b: LessonGlyph, n = 10): Q[] {
  return Array.from({ length: n }, (_, k) => {
    const ans = Math.random() < 0.5 ? a : b;
    return { kind: k % 2 === 0 ? "which-letter" : "which-name", answer: ans, options: shuffle([a, b]) };
  });
}

// ─────────────────────────────────────────────── lessons

function Done({ score, pass, next, onAgain }: { score: number; pass: number; next?: () => void; onAgain: () => void }) {
  const ok = score >= pass;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
      <p className="text-5xl">{ok ? "⭐" : "💪"}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900">{score}%</p>
      <p className="mt-1 text-stone-700">{ok ? "You learned it!" : "Almost! Try again to open the next letter."}</p>
      <div className="mt-4 flex justify-center gap-3">
        <button type="button" onClick={onAgain} className="rounded-lg border border-amber-600 px-4 py-2 font-semibold text-amber-800">
          Again
        </button>
        {ok && next && (
          <button type="button" onClick={next} className="rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white">
            Next letter →
          </button>
        )}
      </div>
    </div>
  );
}

function LetterLessonView({ lesson, known, next }: { lesson: LetterLesson; known: LessonGlyph[]; next?: () => void }) {
  const g = GLYPHS.get(lesson.letter!)!;
  const strokes = LETTER_STROKES[g.id] ?? [];
  const [phase, setPhase] = useState<"learn" | "trace" | "draw" | "quiz" | "done">("learn");
  const [score, setScore] = useState(0);
  const [run, setRun] = useState(0);
  const qs = useMemo(() => letterQuestions(g, known), [g, known, run]); // eslint-disable-line react-hooks/exhaustive-deps
  const STEPS = ["learn", "trace", "draw", "quiz"] as const;
  return (
    <div className="space-y-4">
      <ol className="flex justify-center gap-2 text-sm">
        {(["Learn", "Trace it", "Draw it", "Questions"] as const).map((t, k) => (
          <li
            key={t}
            className={`rounded-full px-3 py-1 ${STEPS.indexOf(phase as (typeof STEPS)[number]) >= k || phase === "done" ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-500"}`}
          >
            {k + 1}. {t}
          </li>
        ))}
      </ol>
      {phase === "learn" && (
        <div className="grid items-center gap-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div className="mx-auto w-48">
            <Tile glyph={g.char} label={g.name} sub={g.sound} rec={`letter:${g.id}`} />
            <p dir="rtl" lang="he" className="mt-2 text-center font-hebrew text-2xl text-amber-800">
              {g.he}
            </p>
          </div>
          <div>
            <p className="mb-2 text-center font-semibold text-stone-800">How to write it</p>
            <WriteDemo strokes={strokes} />
          </div>
          <div className="text-center sm:col-span-2">
            <button type="button" onClick={() => setPhase("trace")} className="rounded-full bg-amber-700 px-6 py-2.5 text-lg font-semibold text-white">
              Now you write it →
            </button>
          </div>
        </div>
      )}
      {phase === "trace" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-center text-lg font-semibold text-stone-800">Trace the letter with your finger. Start at 1.</p>
          <DrawPad key="trace" strokes={strokes} guide onPass={() => setPhase("draw")} />
        </div>
      )}
      {phase === "draw" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-center text-lg font-semibold text-stone-800">
            Now write{" "}
            <span dir="rtl" lang="he" className="font-hebrew text-2xl">
              {g.char}
            </span>{" "}
            by yourself! Remember where each line starts.
          </p>
          <DrawPad key="draw" strokes={strokes} guide numbers={false} onPass={() => setPhase("quiz")} />
          <button type="button" onClick={() => setPhase("trace")} className="mt-3 block w-full text-center text-sm text-amber-800 underline">
            Trace it again first
          </button>
        </div>
      )}
      {phase === "quiz" && (
        <Quiz
          key={run}
          questions={qs}
          pass={4}
          onDone={(r) => {
            const s = Math.round((100 * r) / qs.length);
            setScore(s);
            recordPractice(learnKey(lesson.id), s);
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && (
        <Done
          score={score}
          pass={LEARN_PASS}
          next={next}
          onAgain={() => {
            setRun((r) => r + 1);
            setPhase("quiz");
          }}
        />
      )}
    </div>
  );
}

function PairLessonView({ lesson, next }: { lesson: LetterLesson; next?: () => void }) {
  const [a, b] = lesson.pair!.map((id) => GLYPHS.get(id)!);
  const [phase, setPhase] = useState<"look" | "quiz" | "done">("look");
  const [score, setScore] = useState(0);
  const [run, setRun] = useState(0);
  const qs = useMemo(() => pairQuestions(a, b), [a, b, run]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-4">
      {phase === "look" && (
        <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5">
          <h2 className="text-center text-xl font-semibold text-stone-900">These two letters look alike. Don&apos;t mix them up!</h2>
          <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-4" dir="rtl">
            {[a, b].map((g) => (
              <Tile key={g.id} glyph={g.char} label={g.name} sub={g.sound} rec={`letter:${g.id}`} />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-stone-800">{lesson.tip}</p>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setPhase("quiz")} className="rounded-full bg-amber-700 px-6 py-2.5 text-lg font-semibold text-white">
              Practice →
            </button>
          </div>
        </div>
      )}
      {phase === "quiz" && (
        <Quiz
          key={run}
          questions={qs}
          pass={8}
          onDone={(r) => {
            const s = Math.round((100 * r) / qs.length);
            setScore(s);
            recordPractice(learnKey(lesson.id), s);
            setPhase("done");
          }}
        />
      )}
      {phase === "done" && (
        <Done
          score={score}
          pass={LEARN_PASS}
          next={next}
          onAgain={() => {
            setRun((r) => r + 1);
            setPhase("quiz");
          }}
        />
      )}
    </div>
  );
}

/** Script letters: each print letter beside its handwritten form, then questions. */
function ScriptLessonView() {
  const glyphs = [...GLYPHS.values()].filter((g) => !["vet", "khaf", "fe", "sin"].includes(g.id));
  const [phase, setPhase] = useState<"look" | "quiz" | "done">("look");
  const [score, setScore] = useState(0);
  const [run, setRun] = useState(0);
  const plain = (c: string) => c.replace(/[ְ-ׇ]/g, "");
  const qs = useMemo(
    () =>
      shuffle(glyphs)
        .slice(0, 20)
        .map((g) => ({ g, options: shuffle([g, ...shuffle(glyphs.filter((x) => x.id !== g.id)).slice(0, 3)]) })),
    [run], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  if (phase === "look")
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-center text-lg text-stone-800">This is how the letters look when we write by hand (script).</p>
        <div dir="rtl" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {glyphs.map((g) => (
            <div key={g.id} className="rounded-xl border border-stone-200 p-2 text-center">
              <span lang="he" className="block font-hebrew text-4xl">
                {plain(g.char)}
              </span>
              <span lang="he" className="block font-script text-5xl text-amber-900">
                {plain(g.char)}
              </span>
              <span className="text-xs text-stone-500">{g.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setPhase("quiz")} className="rounded-full bg-amber-700 px-6 py-2.5 text-lg font-semibold text-white">
            Practice →
          </button>
        </div>
      </div>
    );
  if (phase === "done")
    return (
      <Done
        score={score}
        pass={LEARN_PASS}
        onAgain={() => {
          setRun((r) => r + 1);
          setI(0);
          setRight(0);
          setPhase("quiz");
        }}
      />
    );
  const q = qs[i];
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm">
      <p className="text-sm text-stone-500">
        Question {i + 1} of {qs.length} · {right} right
      </p>
      <p className="mt-2 text-xl font-semibold text-stone-900">Which print letter is this?</p>
      <p lang="he" className="my-2 font-script text-8xl text-amber-900">
        {plain(q.g.char)}
      </p>
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-3" dir="rtl">
        {q.options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={!!picked}
            onClick={() => {
              setPicked(o.id);
              if (o.id === q.g.id) setRight((r) => r + 1);
            }}
            className={`rounded-2xl border-2 py-3 font-hebrew text-5xl ${
              picked && o.id === q.g.id ? "border-emerald-500 bg-emerald-50" : picked === o.id ? "border-rose-400 bg-rose-50" : "border-stone-200"
            }`}
          >
            {plain(o.char)}
          </button>
        ))}
      </div>
      {picked && (
        <button
          type="button"
          onClick={() => {
            setPicked(null);
            if (i + 1 >= qs.length) {
              const s = Math.round((100 * right) / qs.length);
              setScore(s);
              recordPractice(learnKey("script"), s);
              setPhase("done");
            } else setI(i + 1);
          }}
          className="mt-4 rounded-full bg-amber-700 px-6 py-2.5 text-lg font-semibold text-white"
        >
          Next →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────── the tabs

/**
 * The alef-bet as tabs: "All letters" (every letter and its sound), then one tab per letter,
 * final letter and look-alike lesson, in order. A lesson opens when the one before it is
 * learned (and, for school students, when the teacher has opened that letter).
 */
export function LetterLessons({ all }: { all: React.ReactNode }) {
  const { beginnerLevel, lettersOpen, profile, scriptOpen } = useAuth();
  const best = useBest();
  const free = profile?.role === "teacher" || profile?.role === "admin";
  const school = profile?.role === "student";
  const lessons = useMemo(() => (school || free ? [...LETTER_LESSONS, SCRIPT_LESSON] : LETTER_LESSONS), [school, free]);
  const learned = (l: LetterLesson) => (best[learnKey(l.id)] ?? 0) >= LEARN_PASS;
  const teacherOpened = (l: LetterLesson) => {
    if (free || profile?.role === "family") return true;
    if (l.kind === "script") return scriptOpen;
    if (beginnerLevel >= 4) return true;
    return LETTERS.findIndex((x) => x.id === l.gate) < Math.max(1, lettersOpen);
  };
  const isOpen = (k: number) => free || (teacherOpened(lessons[k]) && (k === 0 || learned(lessons[k - 1])));
  const [tab, setTab] = useState<string>("all");
  useEffect(() => {
    const h = location.hash.slice(1);
    if (h && lessons.some((l) => l.id === h)) setTab(h);
  }, [lessons]);
  const k = lessons.findIndex((l) => l.id === tab);
  const lesson = lessons[k];
  const known = useMemo(
    () =>
      lessons
        .slice(0, Math.max(0, k + 1))
        .filter((l) => l.kind === "letter")
        .map((l) => GLYPHS.get(l.letter!)!),
    [lessons, k],
  );
  const go = (id: string) => {
    setTab(id);
    history.replaceState(null, "", id === "all" ? location.pathname : `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextOpen = k >= 0 && k + 1 < lessons.length ? () => go(lessons[k + 1].id) : undefined;
  return (
    <div>
      <div className="sticky top-14 z-10 -mx-4 mb-4 border-b border-stone-200 bg-[#fbf8f3]/95 px-4 py-2 backdrop-blur">
        <div dir="rtl" className="flex flex-wrap justify-center gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => go("all")}
            className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${tab === "all" ? "bg-amber-700 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"}`}
          >
            All letters
          </button>
          {lessons.map((l, i) => {
            const open = isOpen(i);
            const done = learned(l);
            const label =
              l.kind === "letter"
                ? GLYPHS.get(l.letter!)!.char
                : l.kind === "pair"
                  ? l.pair!.map((id) => GLYPHS.get(id)!.char).join(" / ")
                  : "✍️";
            return (
              <button
                key={l.id}
                type="button"
                disabled={!open}
                onClick={() => go(l.id)}
                title={l.kind === "pair" ? "Look-alike letters" : l.kind === "script" ? "Script letters" : GLYPHS.get(l.letter!)!.name}
                className={`relative shrink-0 rounded-xl px-3 py-1 font-hebrew text-2xl ${
                  tab === l.id
                    ? "bg-amber-700 text-white"
                    : open
                      ? l.kind === "pair"
                        ? "bg-rose-50 text-rose-900 ring-1 ring-rose-200"
                        : "bg-white text-stone-900 ring-1 ring-stone-200"
                      : "bg-stone-100 text-stone-300"
                }`}
              >
                <span lang="he">{label}</span>
                {done && <span className="absolute -top-1 -left-1 rounded-full bg-emerald-500 px-1 font-sans text-[10px] text-white">✓</span>}
                {!open && <span className="absolute -top-1 -left-1 font-sans text-[10px]">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>
      {tab === "all" || !lesson ? (
        all
      ) : !isOpen(k) ? (
        <p className="rounded-xl bg-stone-100 p-6 text-center text-stone-600">🔒 Learn the letters before this one first.</p>
      ) : lesson.kind === "letter" ? (
        <LetterLessonView key={lesson.id} lesson={lesson} known={known} next={nextOpen} />
      ) : lesson.kind === "pair" ? (
        <PairLessonView key={lesson.id} lesson={lesson} next={nextOpen} />
      ) : (
        <ScriptLessonView />
      )}
    </div>
  );
}
