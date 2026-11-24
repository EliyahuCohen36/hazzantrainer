"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { recordingsChanged, recordingUrl, useFolder } from "@/lib/recordings";
import { getEdits, saveEdits, useSiteEdits, type TaamWord } from "@/lib/site-edits";
import { recordQuiz } from "@/lib/audio/taam-practice";
import { applySpeed, getSpeed } from "@/lib/audio/speed";
import { shuffleArray as shuffle } from "@/lib/audio/shuffle";
import type { TaamReference } from "@/data/teamim-reference";
import { Recording } from "@/components/audio/Recording";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { WithMaamid } from "@/components/reader/Maamid";
import TORAH_WORDS from "@/data/taam-words.json";
import { TaamSubmit } from "./TaamSubmit";

/**
 * The words of a ta'am: for the Torah, 15 ready-made words from the Torah (src/data/taam-words.json,
 * scripts/taam-words/build.ts; ids g0…g14), plus any the owner added; minus the ones he took off.
 */
export function wordsOf(tune: string, taam: string, saved: Record<string, Record<string, TaamWord[]>> | undefined): TaamWord[] {
  const own = saved?.[tune]?.[taam] ?? [];
  const hidden = new Set(own.filter((w) => w.hidden).map((w) => w.id));
  const ready =
    tune === "torah"
      ? ((TORAH_WORDS as Record<string, { word: string; ref: string }[]>)[taam] ?? []).map((w, k) => ({ id: `g${k}`, word: w.word, ref: w.ref }))
      : [];
  return [...ready.filter((w) => !hidden.has(w.id)), ...own.filter((w) => !w.hidden && !w.id.startsWith("g"))];
}

/**
 * Word examples for each ta'am (owner, Nov 21): the Hazzan records words from the Torah (or another book) sung with
 * that ta'am. Everyone can hear them on the ta'am's card, and the students are asked about them ("Which ta'am?").
 * Words: site_settings edits.taamWords[tune][taamId]; recordings: teamim-words/<tune>/<taamId>-<id>.mp3.
 */
export const wordFolder = (tune: string) => `/audio/teamim-words/${tune}`;
export const wordPath = (tune: string, taam: string, id: string) => `${wordFolder(tune)}/${taam}-${id}.mp3`;

/** The word with its nikkud but without te'amim (for the questions). */
const withoutTeamim = (w: string) => w.replace(/[֑-֯]/g, "");

/** Record in the browser and save straight to the recording's place (admin). */
function RecordButton({ path, onSaved }: { path: string; onSaved: () => void }) {
  const [state, setState] = useState<"idle" | "rec" | "saving">("idle");
  const [msg, setMsg] = useState("");
  const rec = useRef<MediaRecorder | null>(null);
  async function start() {
    setMsg("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setMsg("Allow the microphone for this site first.");
    }
    const type = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported?.(t));
    const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("saving");
      const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
      const { error } = await supabase()
        .storage.from("recordings")
        .upload(path.replace(/^\/audio\//, ""), blob, { upsert: true, contentType: blob.type });
      setState("idle");
      if (error) return setMsg(error.message);
      recordingsChanged(path);
      onSaved();
    };
    rec.current = r;
    r.start();
    setState("rec");
  }
  return (
    <span className="inline-flex items-center gap-2">
      {state === "rec" ? (
        <button type="button" onClick={() => rec.current?.stop()} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
          ■ Stop and save
        </button>
      ) : (
        <button
          type="button"
          disabled={state === "saving"}
          onClick={start}
          className="rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "🎙 Record"}
        </button>
      )}
      {msg && <span className="text-xs text-red-700">{msg}</span>}
    </span>
  );
}

/** On a ta'am's card: its word examples to hear, and (admin) adding, recording and removing them. */
export function TaamWords({ tune, taam }: { tune: string; taam: string }) {
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const edits = useSiteEdits();
  const have = useFolder(wordFolder(tune));
  const words = wordsOf(tune, taam, edits.taamWords);
  const own = edits.taamWords?.[tune]?.[taam] ?? [];
  const recorded = words.filter((w) => have?.has(wordPath(tune, taam, w.id)));
  const [adding, setAdding] = useState("");
  const [all, setAll] = useState(false);
  const [msg, setMsg] = useState("");
  if (!admin && !recorded.length) return null;

  /** Save the owner's own list (added words, and ready-made words taken off). */
  async function setWords(list: TaamWord[]) {
    const all = getEdits();
    const byTune = { ...(all.taamWords ?? {}) };
    byTune[tune] = { ...(byTune[tune] ?? {}), [taam]: list };
    const err = await saveEdits({ ...all, taamWords: byTune });
    setMsg(err ?? "");
  }

  return (
    <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
      <p className="text-sm font-semibold text-sky-900">Hear it in words from the text</p>
      <ul className="mt-2 space-y-2">
        {(admin ? words : recorded).slice(0, all ? undefined : 3).map((w) => {
          const p = wordPath(tune, taam, w.id);
          const has = have?.has(p);
          return (
            <li key={w.id} className="flex flex-wrap items-center gap-2">
              <span dir="rtl" lang="he" className="hebrew-text min-w-24 font-hebrew text-2xl leading-[1.8] text-stone-900">
                <WithMaamid text={w.word} />
              </span>
              {w.ref && <span className="text-xs text-stone-400">{w.ref}</span>}
              {has ? <Recording src={p} className="h-8 w-full max-w-[14rem]" /> : <span className="text-xs text-stone-500">No recording yet</span>}
              {has && !admin && (
                <span className="w-full">
                  <TaamSubmit src={p} label="this word" tune={`${tune}-words`} studentsOnly compact />
                </span>
              )}
              {admin && (
                <span data-no-translate className="flex flex-wrap items-center gap-2">
                  <RecordButton path={p} onSaved={() => setMsg("✓ Saved")} />
                  <AdminDrop path={p} compact label={has ? "Replace" : "Drop a file"} />
                  <button
                    type="button"
                    onClick={() => {
                      if (has) supabase().storage.from("recordings").remove([p.replace(/^\/audio\//, "")]).then(() => recordingsChanged(p));
                      setWords(w.id.startsWith("g") ? [...own, { id: w.id, word: w.word, hidden: true }] : own.filter((x) => x.id !== w.id));
                    }}
                    className="text-xs text-red-700"
                  >
                    ✕ Remove
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {(admin ? words : recorded).length > 3 && (
        <button type="button" onClick={() => setAll((x) => !x)} className="mt-1 text-sm text-sky-800 underline">
          {all ? "Show fewer" : `Show all ${(admin ? words : recorded).length} words`}
        </button>
      )}
      {admin && (
        <div data-no-translate dir="ltr" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <input
            dir="rtl"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            placeholder="Type or paste the word (with nikkud and te'amim)"
            className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 font-hebrew text-xl"
          />
          <button
            type="button"
            disabled={!adding.trim()}
            onClick={() => {
              setWords([...own, { id: Date.now().toString(36), word: adding.trim() }]);
              setAdding("");
            }}
            className="rounded-full bg-violet-700 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            + Add this word
          </button>
          <span className="w-full text-xs text-stone-500">Then press 🎙 Record beside it (or drop a file). Students are asked about every word that has a recording.</span>
          {msg && <span className="text-xs text-violet-900">{msg}</span>}
        </div>
      )}
    </div>
  );
}

interface Q {
  taam: TaamReference;
  word: TaamWord;
  options: TaamReference[];
}

/**
 * "Which ta'am is it?": the Hazzan sings a word from the text (shown without its te'amim); the student picks the
 * ta'am. Only te'amim the student has open, and only words that have a recording.
 */
export function TaamWordsQuiz({ tune, pool, title = "Which ta'am? Words from the text" }: { tune: string; pool: TaamReference[]; title?: string }) {
  const edits = useSiteEdits();
  const have = useFolder(wordFolder(tune));
  const items = useMemo(() => {
    const out: { taam: TaamReference; word: TaamWord }[] = [];
    for (const t of pool)
      for (const w of wordsOf(tune, t.id ?? "", edits.taamWords)) if (have?.has(wordPath(tune, t.id!, w.id))) out.push({ taam: t, word: w });
    return out;
  }, [pool, edits, have, tune]);
  const withWords = new Set(items.map((x) => x.taam.id));
  const [qs, setQs] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const q = qs?.[i];
  useEffect(() => {
    setUrl(null);
    if (!q) return;
    let live = true;
    recordingUrl(wordPath(tune, q.taam.id!, q.word.id)).then((u) => live && setUrl(u), () => {});
    return () => {
      live = false;
    };
  }, [q, tune]);
  useEffect(() => {
    const a = audio.current;
    if (a && url) {
      applySpeed(a, getSpeed());
      void a.play().catch(() => {});
    }
  }, [url]);

  if (withWords.size < 2) return null;
  const start = () => {
    const picks = shuffle(items).slice(0, Math.min(10, items.length));
    setQs(
      picks.map(({ taam, word }) => ({
        taam,
        word,
        options: shuffle([taam, ...shuffle(pool.filter((t) => t.id !== taam.id)).slice(0, Math.min(3, pool.length - 1))]),
      })),
    );
    setI(0);
    setRight(0);
    setPicked(null);
  };
  return (
    <section className="mt-6 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
      {!qs ? (
        <>
          <p className="mt-1 text-sm text-stone-600">
            Hear the Hazzan sing a word from the text. The word is shown without its te&apos;amim: which ta&apos;am did you hear?
          </p>
          <button type="button" onClick={start} className="mt-3 rounded-xl bg-sky-700 px-5 py-2.5 font-semibold text-white">
            Start ▶
          </button>
        </>
      ) : !q ? (
        <div className="mt-3 text-center">
          <p className="text-3xl font-semibold text-stone-900">
            {right} of {qs.length}
          </p>
          <button type="button" onClick={start} className="mt-3 rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white">
            Again
          </button>
        </div>
      ) : (
        <div className="mt-3 text-center">
          <p className="text-sm text-stone-500">
            Question {i + 1} of {qs.length} · {right} right
          </p>
          {url && <audio ref={audio} src={url} preload="auto" />}
          <button
            type="button"
            onClick={() => {
              const a = audio.current;
              if (a) {
                a.currentTime = 0;
                applySpeed(a, getSpeed());
                void a.play().catch(() => {});
              }
            }}
            className="mt-2 rounded-full bg-sky-600 px-6 py-2.5 text-lg font-semibold text-white"
          >
            🔊 Listen
          </button>
          <p dir="rtl" lang="he" className="hebrew-text my-3 font-hebrew text-5xl leading-[1.9] text-stone-900">
            {picked ? <WithMaamid text={q.word.word} /> : withoutTeamim(q.word.word)}
          </p>
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
            {q.options.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={!!picked}
                onClick={() => {
                  setPicked(o.id!);
                  const ok = o.id === q.taam.id;
                  if (ok) setRight((r) => r + 1);
                  recordQuiz(`taam-word:${tune}:${q.taam.id}`, ok);
                }}
                className={`rounded-xl border-2 px-3 py-2.5 font-semibold ${
                  picked && o.id === q.taam.id
                    ? "border-emerald-500 bg-emerald-50"
                    : picked === o.id
                      ? "border-rose-400 bg-rose-50"
                      : "border-stone-300 bg-white hover:border-sky-400"
                }`}
              >
                {o.syrian}{" "}
                <span dir="rtl" lang="he" className="font-hebrew text-amber-800">
                  {o.hebrew}
                </span>
              </button>
            ))}
          </div>
          {picked && (
            <div className="mt-3">
              <p className={picked === q.taam.id ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                {picked === q.taam.id ? "Right!" : "Not quite."} It&apos;s {q.taam.syrian}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPicked(null);
                  setI(i + 1);
                }}
                className="mt-2 rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
