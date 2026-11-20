"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import words from "@/data/sheva-words.json";
import {
  CHOICE_LABELS,
  PART_TITLES,
  SHEVA_STAGES,
  SOUND_PASS,
  SOUND_QUESTIONS,
  shevaStageKey,
  type ShevaStage,
  type StagePart,
} from "@/data/sheva-stages";
import { SHEVA, withNekuda, type Letter } from "@/data/beginner";
import { beginnerRecording } from "@/data/beginner-recordings";
import { loadProgress, recordPractice, recordQuiz, PROGRESS_EVENT } from "@/lib/audio/taam-practice";
import { shuffleArray as shuffle } from "@/lib/audio/shuffle";
import { recordingUrl } from "@/lib/recordings";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { useQuestions, type QArea } from "@/lib/question-settings";
import { saveEdits, getEdits, useSiteEdits, type WordEdit } from "@/lib/site-edits";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { StageChart, soundLetters } from "./LessonCharts";
import { ReviewTab, WhatToDo } from "./LessonIntro";

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

/** A question: a word to read, or a sound to hear (the Hazzan's recordings of the letters). */
type Question = { type: "word"; item: Item } | { type: "sound"; kind: "nach" | "na"; letter: Letter; options: Letter[] };

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
    <span dir="rtl" lang="he" className={`hebrew-text font-hebrew ${big ? "text-6xl leading-[1.9]" : "text-3xl leading-[1.8]"} text-stone-900`}>
      {parts.map((p, k) => (
        <span key={k} className={`${p.meteg ? "maamid" : ""} ${k === item.i ? "rounded bg-amber-200 px-0.5" : ""}`}>
          {p.t}
        </span>
      ))}
    </span>
  );
}

/** Why the answer is what it is: said after every answer, and the main help when the child gets it wrong. */
const WHY: Record<string, string> = {
  "nach-patah": "The letter before the Sheva has a Patah. A Patah is a short vowel, so the Sheva after it is Nach: silent.",
  "nach-segol": "The letter before the Sheva has a Segol. A Segol is a short vowel, so the Sheva after it is Nach: silent.",
  "nach-hiriq": "The letter before the Sheva has a Hiriq with no Yod after it. That is a short vowel, so the Sheva is Nach: silent.",
  "nach-katan": "The letter before the Sheva has a Qamats Katan (\"o\"). That is a short vowel, so the Sheva is Nach: silent.",
  "nach-qibbus": "The letter before the Sheva has a Qibbus. A Qibbus is a short vowel, so the Sheva is Nach: silent.",
  "na-qamats": "The letter before the Sheva has a Qamats (with a ma'amid). A Qamats is a long vowel, so the Sheva after it is Na: say \"e\".",
  "na-tsere": "The letter before the Sheva has a Tsere. A Tsere is a long vowel, so the Sheva after it is Na: say \"e\".",
  "na-hiriq": "The letter before the Sheva has a Hiriq with a Yod. That is a long vowel, so the Sheva is Na: say \"e\".",
  "na-holam": "The letter before the Sheva has a Holam. A Holam is a long vowel, so the Sheva is Na: say \"e\".",
  "na-shuruk": "The letter before the Sheva has a Shuruq (וּ) in the middle of the word. That is a long vowel, so the Sheva is Na: say \"e\".",
  "nach-u": "The word starts with וּ. The Sheva right after a וּ at the start of a word is Nach: silent.",
  end: "The Sheva is at the end of the word. A Sheva at the end of a word is always Nach: silent.",
  "na-start": "The Sheva is under the FIRST letter of the word. A Sheva on the first letter is always Na: say \"e\".",
  "two-middle": "There are two Shevas in a row. The first is Nach and the second is Na: say \"e\" on the second.",
  "na-dagesh": "The letter with the Sheva has a Dagesh inside it. A Sheva on a letter with a Dagesh is Na: say \"e\".",
  "na-double": "The same letter comes twice in a row, and the first one has the Sheva. That Sheva is always Na: say \"e\".",
  "katan-sheva": "There is no ma'amid next to the Qamats, and a Sheva comes after it: it is a Qamats Katan, said \"o\".",
  "gadol-sheva": "There is a ma'amid (a little line) next to the Qamats: it is a Qamats Gadol, said \"a\", and the Sheva after it is Na.",
  "katan-both": "Look for the ma'amid: with a ma'amid the Qamats says \"a\"; with no ma'amid before a Sheva it says \"o\".",
  "katan-maqaf": "The word is joined to the next word with a Maqaf (־) and has no ta'am: its Qamats is a Qamats Katan, said \"o\".",
  "genuva-w": "The Patah is under ח, ע or הּ at the end of the word, after an \"o\" or \"u\": say a little \"w\" and the Patah BEFORE the letter.",
  "genuva-y": "The Patah is under ח, ע or הּ at the end of the word, after an \"e\" or \"i\": say a little \"y\" and the Patah BEFORE the letter.",
  "dagesh-kal": "The Dagesh is in בּ גּ דּ כּ פּ תּ at the START of the word: it is a Dagesh Kal. It only makes the letter hard.",
  "dagesh-hazaq": "The letter with the Dagesh comes right after a short vowel: it is a Dagesh Hazaq. Say the letter twice.",
  "he-yediah": "The ה is at the start of the word with a Patah (or Qamats) and means \"the\": He HaYedi'ah.",
  "he-sheelah": "The ה is at the start of the word with a Hataf Patah: it asks a question. He HaShe'elah.",
  "he-megamah": "The ה is at the end of the word, with no dot, and means \"towards\" a place: He HaMegamah.",
  "he-mappiq": "The ה at the end of the word has a dot inside it (a Mappiq): it means \"her\". Say the h!",
};

/** What the child is asked, by step. */
const PROMPT: Partial<Record<StagePart, string>> = {
  katan: "Look at the highlighted Qamats. How do you read the word?",
  genuva: "Look at the last letter. How do you read the word?",
  dagesh: "Look at the highlighted letter.",
  he: "Look at the highlighted ה. Which He is it?",
};

/** What to do, said before the questions start. */
function whatToDo(stage: ShevaStage, n: number, pass: number) {
  if (stage.sounds)
    return (
      <>
        Press <b>🔊 Listen</b> to hear me say a letter with a Sheva {stage.sounds === "nach" ? "Nach (just the letter's sound)" : "Na (with a short “e”)"}.
        Then <b>tap the letter you heard</b>. {n} questions; get <b>{pass}</b> right to finish this level.
      </>
    );
  const choice = stage.ask === "choice";
  return (
    <>
      You will see a word from the Torah with one letter <span className="rounded bg-amber-200 px-1">highlighted</span>.{" "}
      {choice ? "Pick what kind it is." : "Pick how the word is read."} Say it out loud too! Sometimes you will hear me say a sound
      instead: tap the letter you heard. {n} questions; get <b>{pass}</b> right to finish this level. If you get one wrong, I&apos;ll
      tell you why.
    </>
  );
}

function answerName(q: Item) {
  if (q.a === "na") return "Sheva Na";
  if (q.a === "nach") return "Sheva Nach";
  if (q.a === "o") return "Qamats Katan";
  if (q.a === "a") return "Qamats Gadol";
  if (q.a === "w" || q.a === "y") return "Patah Genuva";
  if (CHOICE_LABELS[q.a]) return CHOICE_LABELS[q.a].en;
  return "";
}

const areaOf = (p: StagePart): QArea => (p === "nach" || p === "na" || p === "mixed" ? "sheva" : p);
const editKey = (it: Item) => `${it.k}|${it.w}`;

/** The stage's words, with the owner's corrections (Edit this word) applied and hidden ones left out. */
function poolOf(stage: ShevaStage, edits: Record<string, WordEdit> | undefined): Item[] {
  return stage.from
    .flatMap((k) => WORDS[k] ?? [])
    .map((it) => {
      const e = edits?.[editKey(it)];
      return e ? { ...it, w: e.w || it.w, r: e.r || it.r, x: e.x || it.x, y: e.y || it.y, _hide: e.hide, _key: editKey(it) } : { ...it, _key: editKey(it) };
    })
    .filter((it) => !(it as { _hide?: boolean })._hide);
}

function soundQuestion(kind: "nach" | "na", letters: Letter[], target?: Letter): Question | null {
  if (letters.length < 3) return null;
  const letter = target ?? shuffle(letters)[0];
  const others = shuffle(letters.filter((l) => l.sym !== letter.sym)).slice(0, 2);
  return { type: "sound", kind, letter, options: shuffle([letter, ...others]) };
}

function makeQuestions(stage: ShevaStage, n: number, pool: Item[]): Question[] {
  if (stage.sounds) {
    const ls = soundLetters(stage.sounds);
    const out: Question[] = [];
    while (out.length < n && ls.length >= 3) for (const l of shuffle(ls)) if (out.length < n) out.push(soundQuestion(stage.sounds, ls, l)!);
    return out;
  }
  const items: Item[] = [];
  while (items.length < n && pool.length) items.push(...shuffle(pool));
  const qs: Question[] = items.slice(0, n).map((item) => ({ type: "word", item }));
  // Mix in some listening questions with the Hazzan's recordings (owner): about one in six.
  if (stage.part === "nach" || stage.part === "na" || stage.part === "mixed") {
    for (let k = 5; k < qs.length; k += 6) {
      const kind = stage.part === "mixed" ? (k % 12 === 5 ? "nach" : "na") : stage.part;
      const sq = soundQuestion(kind, soundLetters(kind));
      if (sq) qs[k] = sq;
    }
  }
  return qs;
}

async function playSound(q: Extract<Question, { type: "sound" }>, set: (b: boolean) => void) {
  const p = beginnerRecording(q.kind === "nach" ? `alone:${q.letter.id}` : `sound:${q.letter.id}:sheva-na`);
  if (!p) return;
  set(true);
  try {
    const url = await recordingUrl(p);
    await playUrls([url]).done;
  } catch {
    // not available
  }
  set(false);
}

/** The owner fixes a question's word or readings (saved for everyone; Tanakh text itself is not changed). */
function EditWord({ item, onClose }: { item: Item & { _key?: string }; onClose: () => void }) {
  const key = item._key ?? editKey(item);
  const cur = getEdits().words?.[key] ?? {};
  const [e, setE] = useState<WordEdit>({ w: cur.w ?? item.w, r: cur.r ?? item.r, x: cur.x ?? item.x, y: cur.y ?? item.y, hide: cur.hide });
  const [msg, setMsg] = useState("");
  async function save(remove = false) {
    const all = getEdits();
    const w = { ...(all.words ?? {}) };
    if (remove) delete w[key];
    else w[key] = e;
    const err = await saveEdits({ ...all, words: w });
    setMsg(err ?? "Saved. It shows like this for everyone from the next question.");
  }
  const field = (k: keyof WordEdit, label: string, rtl = false) => (
    <label className="block text-left">
      <span className="text-xs text-stone-600">{label}</span>
      <input
        dir={rtl ? "rtl" : "ltr"}
        value={(e[k] as string) ?? ""}
        onChange={(ev) => setE({ ...e, [k]: ev.target.value })}
        className={`w-full rounded border border-stone-300 px-2 py-1 ${rtl ? "font-hebrew text-2xl" : ""}`}
      />
    </label>
  );
  return (
    <div data-no-translate className="mt-4 space-y-2 rounded-2xl border border-violet-300 bg-violet-50 p-3 text-sm" dir="ltr">
      <p className="font-semibold text-violet-900">Edit this question (only you see this)</p>
      {field("w", "The word (Hebrew)", true)}
      {item.r !== undefined && field("r", "The right reading")}
      {item.x !== undefined && field("x", "A wrong reading")}
      {item.y !== undefined && field("y", "Another wrong reading")}
      <label className="flex items-center gap-2 text-xs text-stone-700">
        <input type="checkbox" checked={!!e.hide} onChange={(ev) => setE({ ...e, hide: ev.target.checked || undefined })} /> Don&apos;t ask this word
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save()} className="rounded-full bg-violet-700 px-4 py-1.5 font-semibold text-white">
          Save
        </button>
        {getEdits().words?.[key] && (
          <button type="button" onClick={() => save(true)} className="rounded-full px-3 py-1.5 text-violet-900 ring-1 ring-violet-300">
            Back to the original
          </button>
        )}
        <button type="button" onClick={onClose} className="px-2 text-stone-500">
          Close
        </button>
      </div>
      {msg && <p className="text-violet-900">{msg}</p>}
    </div>
  );
}

/**
 * Reading-rule practice (Sheva, Qamats Katan, Patah Genuva, Dagesh, the four He). Each level: an
 * introduction with its own chart, then only the questions (the chart is in a small Review tab),
 * with the reason after every answer. `parts` picks which levels this page shows.
 */
export function ShevaTrainer({ parts }: { parts?: StagePart[] }) {
  const { beginnerLevel, profile } = useAuth();
  const admin = profile?.role === "admin";
  const free = profile?.role === "teacher" || admin;
  const best = useBest();
  const edits = useSiteEdits();
  const qSheva = useQuestions("sheva")!;
  const qKatan = useQuestions("katan")!;
  const qGenuva = useQuestions("genuva")!;
  const qDagesh = useQuestions("dagesh")!;
  const qHe = useQuestions("he")!;
  const setting = (s: ShevaStage) =>
    s.sounds
      ? { n: SOUND_QUESTIONS, pass: SOUND_PASS }
      : ({ sheva: qSheva, katan: qKatan, genuva: qGenuva, dagesh: qDagesh, he: qHe } as Record<string, { n: number; pass: number }>)[areaOf(s.part)];
  const passed = (s: ShevaStage) => (best[`${shevaStageKey(s.id)}:passed`] ?? 0) >= 100 || (best[shevaStageKey(s.id)] ?? 0) >= 80;
  const isOpen = (i: number) => beginnerLevel >= SHEVA_STAGES[i].level && (free || i === 0 || passed(SHEVA_STAGES[i - 1]));

  const [stage, setStage] = useState<ShevaStage | null>(null);
  const [phase, setPhase] = useState<"intro" | "questions" | "done">("intro");
  const [qs, setQs] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const q = qs[i];
  const options = useMemo(() => {
    if (!q || !stage || q.type !== "word") return [];
    if (stage.ask === "choice") return stage.choices ?? [];
    const wrong = (stage.wrong ?? ["x"]).map((k) => q.item[k]).filter((x): x is string => !!x && x !== q.item.r);
    return shuffle([q.item.r!, ...Array.from(new Set(wrong))]);
  }, [q, stage]);
  const rightAnswer = q?.type === "sound" ? q.letter.id : stage?.ask === "choice" ? q?.item.a : q?.item.r;

  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (SHEVA_STAGES.some((s) => s.id === id)) document.getElementById(`stage-${id}`)?.scrollIntoView({ block: "center" });
  }, []);

  // A listening question plays by itself when it opens.
  useEffect(() => {
    if (phase === "questions" && q?.type === "sound") playSound(q, setPlaying);
  }, [phase, q]);

  const open = (s: ShevaStage) => {
    setStage(s);
    setPhase("intro");
    setEditing(false);
    window.scrollTo({ top: 0 });
  };
  const start = (s: ShevaStage) => {
    unlockAudio();
    setQs(makeQuestions(s, setting(s).n, poolOf(s, edits.words)));
    setI(0);
    setRight(0);
    setPicked(null);
    setPhase("questions");
    window.scrollTo({ top: 0 });
  };

  if (stage && phase === "intro") {
    const st = setting(stage);
    const examples = stage.sounds ? [] : poolOf(stage, edits.words).slice(0, 3);
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setStage(null)} className="text-sm text-amber-800 hover:underline">
          ← All levels
        </button>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold text-stone-900">{stage.title}</h2>
            <span dir="rtl" lang="he" className="font-hebrew text-xl text-amber-800">
              {stage.he}
            </span>
          </div>
          <p className="mt-2 text-stone-700">{stage.rule}</p>
        </div>
        {stage.sounds && (
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 shadow-sm">
            <SpeedControl compact />
          </div>
        )}
        <StageChart stage={stage} />
        {examples.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <p className="mb-2 font-semibold text-stone-900">For example</p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {examples.map((x) => (
                <li key={x.w} className="rounded-xl bg-stone-50 px-3 py-2 text-center">
                  <ShevaWord item={x} big={false} />
                  <span className="block text-sm font-semibold text-stone-700" dir="ltr">
                    {stage.ask === "choice" ? CHOICE_LABELS[x.a]?.en : x.r}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <WhatToDo>{whatToDo(stage, st.n, st.pass)}</WhatToDo>
        <div className="text-center">
          <button type="button" onClick={() => start(stage)} className="rounded-xl bg-amber-700 px-6 py-3 text-lg font-semibold text-white hover:bg-amber-800">
            Start the questions ▶
          </button>
        </div>
      </div>
    );
  }

  if (stage && phase === "done") {
    const st = setting(stage);
    const ok = right >= Math.min(st.pass, qs.length);
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-stone-500">{stage.title}</p>
        <p className="mt-2 text-4xl font-semibold text-stone-900">
          {right} of {qs.length}
        </p>
        <p className="mt-2 text-stone-700">{ok ? "Level passed! The next level is open. 🎉" : `Get ${st.pass} right to pass. Try again!`}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" onClick={() => start(stage)} className="rounded-lg border border-amber-600 px-4 py-2 font-semibold text-amber-800">
            Again
          </button>
          <button type="button" onClick={() => setStage(null)} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
            All levels
          </button>
        </div>
      </div>
    );
  }

  if (stage && q) {
    const correct = picked === rightAnswer;
    const choice = stage.ask === "choice";
    const next = () => {
      const n = i + 1;
      setPicked(null);
      setEditing(false);
      if (n >= qs.length) {
        const st = setting(stage);
        recordPractice(shevaStageKey(stage.id), Math.round((100 * right) / qs.length));
        if (right >= Math.min(st.pass, qs.length)) recordPractice(`${shevaStageKey(stage.id)}:passed`, 100);
        setPhase("done");
      } else setI(n);
    };
    const answer = (o: string) => {
      setPicked(o);
      const ok = o === rightAnswer;
      if (ok) setRight((r) => r + 1);
      recordQuiz(q.type === "word" ? `beginner-sheva-rule:${q.item.k}` : `beginner-sheva-sound:${q.kind}`, ok);
    };
    return (
      <div>
        <ReviewTab>
          <p className="mb-2 text-sm text-stone-700">{stage.rule}</p>
          <StageChart stage={stage} />
        </ReviewTab>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm text-stone-500">
            <button type="button" onClick={() => setStage(null)} className="text-amber-800 hover:underline">
              ← All levels
            </button>
            <span>
              Question {i + 1} of {qs.length} · {right} right
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(100 * i) / qs.length}%` }} />
          </div>

          {q.type === "sound" ? (
            <>
              <p className="mt-3 text-center text-sm font-medium text-stone-700">Listen, then tap the letter you heard.</p>
              <div className="my-3 text-center">
                <button
                  type="button"
                  onClick={() => playSound(q, setPlaying)}
                  className={`rounded-full bg-sky-600 px-6 py-3 text-lg font-semibold text-white ${playing ? "ring-4 ring-sky-300" : ""}`}
                >
                  🔊 Listen
                </button>
              </div>
              <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
                {q.options.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    disabled={!!picked}
                    onClick={() => answer(l.id)}
                    className={`rounded-xl border-2 py-3 font-hebrew text-5xl leading-[1.6] ${
                      picked && l.id === rightAnswer
                        ? "border-emerald-500 bg-emerald-50"
                        : picked === l.id
                          ? "border-rose-400 bg-rose-50"
                          : "border-stone-300 bg-white hover:border-amber-400"
                    }`}
                    lang="he"
                  >
                    {withNekuda(l, SHEVA)}
                  </button>
                ))}
              </div>
              {picked && (
                <div className="mt-4 text-center">
                  <p className={correct ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                    {correct ? "Right!" : "Not quite."} You heard{" "}
                    <span lang="he" className="font-hebrew text-2xl">
                      {withNekuda(q.letter, SHEVA)}
                    </span>{" "}
                    ({q.letter.name}) with a {q.kind === "nach" ? "Sheva Nach: just “" + q.letter.sym + "”" : "Sheva Na: “" + q.letter.sym + "e”"}.
                  </p>
                  <button type="button" onClick={next} className="mt-3 rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white">
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="mt-3 text-center text-sm font-medium text-stone-700">
                {q.item.a === "na" || q.item.a === "nach"
                  ? "Look at the highlighted Sheva. How do you read the word?"
                  : (PROMPT[stage.part] ?? "Look at the highlighted Qamats. How do you read the word?")}
              </p>
              <div className="my-3 text-center">
                <ShevaWord item={q.item} />
              </div>
              <div className={`mx-auto grid max-w-md gap-2 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {options.map((o) => (
                  <button
                    key={o}
                    type="button"
                    disabled={!!picked}
                    onClick={() => answer(o)}
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
                <div className={`mx-auto mt-4 max-w-xl rounded-xl p-3 text-center ${correct ? "bg-emerald-50" : "bg-rose-50"}`}>
                  <p className={correct ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                    {correct ? "Right!" : "Not quite."} {answerName(q.item)}
                    {!choice && q.item.r ? (
                      <>
                        {": "}
                        <span dir="ltr">{q.item.r}</span>
                      </>
                    ) : null}
                  </p>
                  {WHY[q.item.k] && <p className={`mt-1 text-sm ${correct ? "text-emerald-900" : "text-rose-900"}`}>{WHY[q.item.k]}</p>}
                  <button type="button" onClick={next} className="mt-3 rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white">
                    Next →
                  </button>
                </div>
              )}
              {admin && !editing && (
                <button type="button" onClick={() => setEditing(true)} className="mt-3 text-xs text-violet-800 underline">
                  ✏️ Edit this word
                </button>
              )}
              {admin && editing && <EditWord item={q.item} onClose={() => setEditing(false)} />}
            </>
          )}
        </div>
      </div>
    );
  }

  // The levels, in parts.
  let lastPart = "";
  return (
    <div>
      <ol className="grid gap-3">
        {SHEVA_STAGES.map((s, k) => {
          if (parts && !parts.includes(s.part)) return null;
          const num = SHEVA_STAGES.slice(0, k + 1).filter((x) => !parts || parts.includes(x.part)).length;
          const ok = isOpen(k);
          const b = best[shevaStageKey(s.id)];
          const done = passed(s);
          const head = s.part !== lastPart;
          lastPart = s.part;
          return (
            <li key={s.id} id={`stage-${s.id}`}>
              {head && <h2 className="mt-4 mb-2 text-lg font-semibold text-stone-900">{PART_TITLES[s.part]}</h2>}
              <button
                type="button"
                disabled={!ok}
                onClick={() => open(s)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm ${
                  ok ? "border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50" : "cursor-not-allowed border-stone-200 bg-stone-50"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full font-semibold ${
                    done ? "bg-emerald-500 text-white" : ok ? "bg-amber-600 text-white" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {done ? "✓" : ok ? num : "🔒"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${ok ? "text-stone-900" : "text-stone-400"}`}>{ok ? s.title : `Level ${num}`}</span>
                  {!ok && (
                    <span className="block text-sm text-stone-500">
                      {beginnerLevel < s.level ? "Your teacher will open this when you're ready." : "Pass the level before to open this one."}
                    </span>
                  )}
                  {ok && b !== undefined && <span className="block text-sm text-stone-500">Best: {b}%</span>}
                </span>
                {ok && (
                  <span dir="rtl" lang="he" className="hidden font-hebrew text-lg text-amber-800 sm:inline">
                    {s.he}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
