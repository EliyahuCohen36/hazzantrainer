"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { NEKUDOT, openLetters, withNekuda, nekudaLevel, type Letter, type Nekuda } from "@/data/beginner";
import { soundOf, syllableRecordings } from "@/data/beginner-recordings";
import { joinedWordUrl } from "@/lib/audio/join-syllables";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { shuffle } from "./WordQuestion";
import { groupLevel, nekudaQuizKey, nekudotKey, type NekudaGroup } from "@/data/nekuda-groups";

/**
 * Practice for a group of nekudot (e.g. Qamats and Patah), with single sounds:
 * one letter with the nekuda (בָּ "ba") or one letter with the nekuda and a letter
 * after it (אָב "av"). Questions, like the letter trainer:
 *  - hear a sound → tap what's written (all of them when two look different but
 *    sound the same: בָּ and בַּ, סָ and שָׂ)
 *  - see it written → pick the sound (of three)
 * Only letters the teacher has opened, and nekudot learned so far, are used.
 */

/** A letter written at the end of a short sound (אָב): final forms where they exist. */
const FINAL_CHAR: Record<string, string> = { khaf: "ך", mem: "ם", nun: "ן", fe: "ף", tsadi: "ץ" };
const NO_FINAL = new Set(["alef", "he", "vav", "yod", "ayin", "het", "kaf", "pe", "bet"]);

interface Item {
  key: string;
  text: string;
  letter: Letter;
  nekuda: Nekuda;
  end?: Letter;
  /** Syllables for the recordings: ["bet:qamats", "resh"]. */
  s: string[];
  /** Same sound = same key here (Bet+a, Samekh/Sin+e …). */
  sound: string;
}

function makeItems(letters: Letter[], nekudot: Nekuda[]): Item[] {
  const out: Item[] = [];
  const ends = letters.filter((l) => !NO_FINAL.has(l.id) && l.sym);
  for (const l of letters)
    for (const n of nekudot) {
      const g = withNekuda(l, n);
      if (!g) continue;
      const base = { letter: l, nekuda: n, s: [`${l.id}:${soundOf(n.id)}`] };
      out.push({ ...base, key: `${l.id}|${n.id}`, text: g, sound: `${l.sym}|${soundOf(n.id)}` });
      if (n.id.startsWith("hataf")) continue; // a hataf doesn't close a sound
      for (const e of ends) {
        if (e.id === l.id) continue;
        out.push({
          ...base,
          key: `${l.id}|${n.id}|${e.id}`,
          text: g + (FINAL_CHAR[e.id] ?? e.char),
          end: e,
          s: [`${l.id}:${soundOf(n.id)}`, e.id],
          sound: `${l.sym}|${soundOf(n.id)}|${e.sym}`,
        });
      }
    }
  return out.filter((it) => syllableRecordings(it.s));
}

type Kind = "hear" | "read";
interface Question {
  kind: Kind;
  item: Item;
  options: Item[];
}
const PER_LETTER = 5;

function makeRound(targets: Item[], all: Item[], letterCount: number): Question[] {
  const total = Math.max(10, Math.min(130, letterCount * PER_LETTER));
  // Spread: one short sound (בָּ) for every long one (אָב), all different until used up.
  const singles = shuffle(targets.filter((t) => !t.end));
  const doubles = shuffle(targets.filter((t) => t.end));
  const picks: Item[] = [];
  while (picks.length < total && (singles.length || doubles.length)) {
    if (singles.length) picks.push(singles.pop()!);
    if (picks.length < total && doubles.length) picks.push(doubles.pop()!);
  }
  while (picks.length < total && targets.length) picks.push(targets[Math.floor(Math.random() * targets.length)]);
  return shuffle(picks).map((item, i) => {
    const kind: Kind = i % 2 ? "read" : "hear";
    const sameShape = (o: Item) => !!o.end === !!item.end;
    if (kind === "read") {
      // Three different sounds: same letter with another vowel, or another letter.
      const others = shuffle(all.filter((o) => sameShape(o) && o.sound !== item.sound));
      const near = others.filter((o) => o.letter.id === item.letter.id);
      const picked: Item[] = [];
      for (const o of [...near, ...others]) if (!picked.some((p) => p.sound === o.sound) && picked.length < 2) picked.push(o);
      return { kind, item, options: shuffle([item, ...picked]) };
    }
    // Hear: every written form with this sound, plus look-alikes to choose from (6 in all).
    const right = all.filter((o) => o.sound === item.sound && sameShape(o));
    const near = shuffle(all.filter((o) => sameShape(o) && o.sound !== item.sound && (o.letter.id === item.letter.id || o.nekuda.id === item.nekuda.id)));
    const far = shuffle(all.filter((o) => sameShape(o) && o.sound !== item.sound));
    const wrong: Item[] = [];
    for (const o of [...near, ...far]) if (!wrong.includes(o) && wrong.length < 6 - Math.min(right.length, 3)) wrong.push(o);
    return { kind, item, options: shuffle([...shuffle(right).slice(0, 3), ...wrong]) };
  });
}

async function playItem(it: Item, setPlaying: (b: boolean) => void) {
  const paths = syllableRecordings(it.s);
  if (!paths) return;
  unlockAudio();
  setPlaying(true);
  try {
    await playUrls([await joinedWordUrl(paths)]).done;
  } catch {
    // nothing to play
  } finally {
    setPlaying(false);
  }
}

const Heb = ({ t, size }: { t: string; size: string }) => (
  <span dir="rtl" lang="he" className={`font-hebrew leading-none ${size}`}>
    {t}
  </span>
);

function QuestionCard({ q, onDone }: { q: Question; onDone: (right: boolean) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const right = q.kind === "read" ? [q.item] : q.options.filter((o) => o.sound === q.item.sound);
  const multi = right.length > 1;
  const ok = checked && picked.length === right.length && right.every((r) => picked.includes(r.key));

  useEffect(() => {
    if (q.kind === "hear") void playItem(q.item, setPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (k: string) => {
    if (checked) return;
    if (!multi) return setPicked([k]);
    setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };
  const tone = (o: Item) => {
    const sel = picked.includes(o.key);
    const good = right.some((r) => r.key === o.key);
    if (!checked) return sel ? "border-amber-500 bg-amber-50 ring-2 ring-amber-300" : "border-stone-200 bg-white hover:bg-amber-50";
    if (good) return "border-emerald-400 bg-emerald-50";
    return sel ? "border-rose-400 bg-rose-50" : "border-stone-200 bg-white opacity-50";
  };

  return (
    <div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
        {q.kind === "hear" ? "Which one says this sound?" : "Which sound is this?"}
      </p>
      {q.kind === "read" ? (
        <>
          <p className="mt-4">
            <Heb t={q.item.text} size="text-8xl" />
          </p>
          <p className="mt-3 text-stone-600">Tap each sound to hear it, then choose.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {q.options.map((o, i) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  void playItem(o, setPlaying);
                  toggle(o.key);
                }}
                className={`rounded-2xl border-2 p-4 transition-colors ${tone(o)}`}
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
            onClick={() => playItem(q.item, setPlaying)}
            className={`mt-5 inline-flex size-20 items-center justify-center rounded-full bg-amber-600 text-4xl text-white shadow hover:bg-amber-700 ${playing ? "animate-pulse" : ""}`}
            aria-label="Hear it again"
          >
            🔊
          </button>
          <p className="mt-2 text-stone-600">
            {multi ? (
              <>
                <b>More than one</b> says this sound. Tap all of them.
              </>
            ) : (
              "Tap the one that says it."
            )}
          </p>
          <div dir="rtl" className="mt-4 grid grid-cols-3 gap-3">
            {q.options.map((o) => (
              <button key={o.key} type="button" onClick={() => toggle(o.key)} className={`rounded-2xl border-2 py-4 transition-colors ${tone(o)}`}>
                <Heb t={o.text} size="text-5xl sm:text-6xl" />
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
          {picked.length ? "Check" : multi ? "Tap all of them" : "Choose one"}
        </button>
      ) : (
        <div className="mt-5">
          <p className={`text-lg font-semibold ${ok ? "text-emerald-700" : "text-rose-700"}`}>
            {ok ? "Right! 🎉" : multi ? "They all say the same sound: the green ones." : "Not quite. The green one is right."}
          </p>
          {!ok && (
            <button type="button" onClick={() => playItem(q.item, setPlaying)} className="mt-1 text-sm font-medium text-amber-800 underline">
              🔊 Hear <Heb t={q.item.text} size="text-xl" /> again
            </button>
          )}
          <div>
            <button
              type="button"
              onClick={() => onDone(ok)}
              className="mt-3 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
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

export function NekudaTrainer({ group }: { group: NekudaGroup }) {
  const { beginnerLevel, lettersOpen, profile } = useAuth();
  const user = profile?.id ?? "guest";
  const letters = useMemo(() => openLetters(lettersOpen, beginnerLevel), [lettersOpen, beginnerLevel]);
  const level = groupLevel(group);
  const learned = useMemo(() => NEKUDOT.filter((n) => nekudaLevel(n.id) <= Math.max(level, 5)), [level]);
  const mine = useMemo(() => NEKUDOT.filter((n) => group.nekudot.includes(n.id)), [group]);
  const all = useMemo(() => makeItems(letters, learned), [letters, learned]);
  const targets = useMemo(() => all.filter((it) => group.nekudot.includes(it.nekuda.id)), [all, group]);
  const best = useBest();
  const key = nekudotKey(group.id);
  const [round, setRound] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const total = Math.max(10, Math.min(130, letters.length * PER_LETTER));

  // A round in progress is kept in the browser (stop and carry on later).
  const saveKey = `kriah-nekuda-run:${user}:${group.id}:${letters.length}`;
  const byKey = useMemo(() => new Map(all.map((it) => [it.key, it])), [all]);
  const [saved, setSaved] = useState<number | null>(null);
  const save = (qs: Question[] | null, at = 0, sc = 0) => {
    try {
      if (!qs) return localStorage.removeItem(saveKey);
      localStorage.setItem(saveKey, JSON.stringify({ i: at, score: sc, qs: qs.map((q) => [q.kind, q.item.key, q.options.map((o) => o.key)]) }));
    } catch {
      // storage unavailable
    }
  };
  const load = (): { qs: Question[]; i: number; score: number } | null => {
    try {
      const d = JSON.parse(localStorage.getItem(saveKey) ?? "null");
      if (!d) return null;
      const qs: Question[] = d.qs.map(([kind, k, opts]: [Kind, string, string[]]) => ({
        kind,
        item: byKey.get(k)!,
        options: opts.map((o) => byKey.get(o)!),
      }));
      return qs.every((q) => q.item && q.options.every(Boolean)) ? { qs, i: d.i, score: d.score } : null;
    } catch {
      return null;
    }
  };
  useEffect(() => {
    setSaved(load()?.i ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveKey, byKey]);

  const start = (resume = false) => {
    unlockAudio();
    const r = resume ? load() : null;
    const qs = r?.qs ?? makeRound(targets, all, letters.length);
    setRound(qs);
    setI(r?.i ?? 0);
    setScore(r?.score ?? 0);
    setDone(false);
    if (!r) save(qs);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <span className="text-sm text-stone-600">Practising:</span>
        <span dir="rtl" lang="he" className="font-hebrew text-3xl text-stone-900">
          {mine.map((n) => withNekuda(letters.find((l) => withNekuda(l, n)) ?? letters[0], n)).join("  ")}
        </span>
        <div className="ms-auto">
          <SpeedControl compact />
        </div>
      </div>

      {targets.length < 3 ? (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-stone-700">
          This practice starts when your teacher has opened a few more letters.
        </p>
      ) : !round ? (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-700">
            {total} questions: hear a sound and find it, or read it and pick the sound. Short sounds like{" "}
            <Heb t={targets.find((t) => !t.end)?.text ?? ""} size="text-2xl" /> and longer ones like{" "}
            <Heb t={targets.find((t) => t.end)?.text ?? ""} size="text-2xl" />.
          </p>
          {best[key] !== undefined && <p className="mt-1 text-sm text-amber-700">Best: {best[key]}%</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {saved !== null && (
              <button type="button" onClick={() => start(true)} className="rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white hover:bg-emerald-700">
                Carry on (question {saved + 1} of {total}) ▶
              </button>
            )}
            <button
              type="button"
              onClick={() => start(false)}
              className={`rounded-xl px-6 py-3 text-lg font-semibold ${saved !== null ? "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50" : "bg-amber-700 text-white hover:bg-amber-800"}`}
            >
              {saved !== null ? "Start again" : "Start ▶"}
            </button>
          </div>
        </div>
      ) : done ? (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-5xl">{score >= round.length * 0.9 ? "🌟" : score >= round.length * 0.7 ? "⭐" : "👍"}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {score} of {round.length} right
          </p>
          <button type="button" onClick={() => start(false)} className="mt-4 rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800">
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
            <button
              type="button"
              onClick={() => {
                setRound(null);
                setSaved(i);
              }}
              className="underline"
              title="Your place is saved"
            >
              Stop for now
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * i) / round.length}%` }} />
          </div>
          <QuestionCard
            key={i}
            q={round[i]}
            onDone={(right) => {
              recordQuiz(nekudaQuizKey(round[i].item.nekuda.id), right);
              const s = score + (right ? 1 : 0);
              setScore(s);
              if (i + 1 >= round.length) {
                recordPractice(key, Math.round((100 * s) / round.length));
                save(null);
                setSaved(null);
                setDone(true);
              } else {
                setI(i + 1);
                save(round, i + 1, s);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
