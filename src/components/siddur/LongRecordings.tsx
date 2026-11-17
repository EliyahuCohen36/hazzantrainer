"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordingUrl, recordingsChanged } from "@/lib/recordings";
import { applySpeed, useSpeed } from "@/lib/audio/speed";
import { supabase } from "@/lib/supabase";
import { AdminDrop } from "@/components/admin/AdminDrop";

/**
 * One recording that covers several paragraphs (e.g. all of Birkot HaShahar):
 * siddur/<part>/long-<n>.mp3, with long-<n>.json = { marks: [{ s, p, t }] } —
 * the second each paragraph starts. The admin marks them by tapping while it
 * plays; every marked paragraph then gets a play button for its own part.
 */
export const LONG_SLOTS = 9;
export const longPath = (part: string, n: number) => `/audio/siddur/${part}/long-${n}.mp3`;
export const longJson = (part: string, n: number) => `/audio/siddur/${part}/long-${n}.json`;

export interface Segment {
  src: string;
  start: number;
  end: number | null;
}
export interface SpokenPara {
  s: number;
  p: number;
  /** First words, to show while marking. */
  head: string;
  /** Letters in it (for estimating where it starts). */
  len: number;
}

/** Load the marks of every long recording of a part: "s-p" → its segment. */
export function useSegments(part: string, have: Set<string> | null): Map<string, Segment> {
  const [map, setMap] = useState<Map<string, Segment>>(new Map());
  const key = have ? [...have].filter((p) => p.includes("/long-")).sort().join("|") : "";
  useEffect(() => {
    let live = true;
    const out = new Map<string, Segment>();
    const jobs: Promise<void>[] = [];
    for (let n = 1; n <= LONG_SLOTS; n++) {
      if (!have?.has(longPath(part, n)) || !have?.has(longJson(part, n))) continue;
      const src = longPath(part, n);
      jobs.push(
        recordingUrl(longJson(part, n))
          .then((u) => fetch(u, { cache: "no-store" }))
          .then((r) => r.json())
          .then((j: { marks: { s: number; p: number; t: number }[] }) => {
            const m = [...(j.marks ?? [])].sort((a, b) => a.t - b.t);
            m.forEach((x, i) => out.set(`${x.s}-${x.p}`, { src, start: x.t, end: m[i + 1]?.t ?? null }));
          })
          .catch(() => {}),
      );
    }
    Promise.all(jobs).then(() => live && setMap(out));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, key]);
  return map;
}

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Plays one paragraph's part of a long recording. */
export function SegmentPlayer({ seg }: { seg: Segment }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const speed = useSpeed();
  useEffect(() => {
    recordingUrl(seg.src).then(setUrl, () => {});
  }, [seg.src]);
  const toggle = async () => {
    const a = ref.current;
    if (!a) return;
    if (!a.paused) return a.pause();
    if (a.currentTime < seg.start || (seg.end !== null && a.currentTime >= seg.end - 0.05)) a.currentTime = seg.start;
    applySpeed(a, speed);
    await a.play().catch(() => {});
  };
  const len = (seg.end ?? seg.start + 1) - seg.start;
  return (
    <span className="inline-flex items-center gap-2 font-sans text-xs text-stone-600" dir="ltr">
      {url && (
        <audio
          ref={ref}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            setPos(Math.max(0, a.currentTime - seg.start));
            if (seg.end !== null && a.currentTime >= seg.end) a.pause();
          }}
        />
      )}
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={!url}
        className="flex size-8 items-center justify-center rounded-full bg-amber-700 text-white disabled:opacity-40"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      {seg.end !== null && (
        <span className="tabular-nums">
          {fmt(pos)} / {fmt(len)}
        </span>
      )}
    </span>
  );
}

/** Admin: mark where each paragraph starts in a long recording. */
function MarkTool({ part, n, paras, onDone }: { part: string; n: number; paras: SpokenPara[]; onDone: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [first, setFirst] = useState(0);
  const [last, setLast] = useState(paras.length - 1);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0); // paragraph being marked (index into the chosen range)
  const [marks, setMarks] = useState<({ s: number; p: number; t: number } | null)[]>([]);
  const [dur, setDur] = useState(0);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    recordingUrl(longPath(part, n)).then(setUrl, () => setMsg("Couldn't load the recording"));
  }, [part, n]);
  const range = paras.slice(first, last + 1);
  const cur = range[i];
  // Where this paragraph probably starts: share out the time left by the letters left.
  const estimate = useMemo(() => {
    if (!dur || !cur) return 0;
    const done = [...marks].reverse().find((m) => m);
    const t0 = done?.t ?? 0;
    const from = done ? marks.lastIndexOf(done) + 1 : 0;
    const lens = range.map((x) => x.len + 15);
    const before = lens.slice(from, i).reduce((a, b) => a + b, 0);
    const rest = lens.slice(from).reduce((a, b) => a + b, 0);
    return t0 + ((dur - t0) * before) / Math.max(1, rest);
  }, [dur, cur, marks, range, i]);

  const mark = (skip = false) => {
    const a = ref.current;
    if (!a || !cur) return;
    setMarks((m) => [...m, skip ? null : { s: cur.s, p: cur.p, t: Math.max(0, a.currentTime - 0.15) }]);
    setI((x) => x + 1);
  };
  const save = async () => {
    setMsg("Saving…");
    const body = JSON.stringify({ marks: marks.filter(Boolean) });
    const { error } = await supabase()
      .storage.from("recordings")
      .upload(longJson(part, n).replace(/^\/audio\//, ""), new Blob([body], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
      });
    setMsg(error ? `✗ ${error.message}` : "✓ Saved: every marked paragraph now has its own play button.");
    if (!error) {
      recordingsChanged(longJson(part, n));
      setTimeout(onDone, 1200);
    }
  };
  const select = "max-w-full rounded border border-stone-300 bg-white px-2 py-1 font-hebrew text-sm";
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm" dir="ltr" data-no-translate>
      {url && (
        <audio ref={ref} src={url} controls className="h-9 w-full" onLoadedMetadata={(e) => setDur(e.currentTarget.duration)} />
      )}
      {!started ? (
        <>
          <label className="block">
            First paragraph in the recording:{" "}
            <select className={select} value={first} onChange={(e) => setFirst(Number(e.target.value))} dir="rtl">
              {paras.map((x, k) => (
                <option key={k} value={k}>
                  {x.head}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Last paragraph in the recording:{" "}
            <select className={select} value={last} onChange={(e) => setLast(Number(e.target.value))} dir="rtl">
              {paras.map((x, k) => (
                <option key={k} value={k} disabled={k < first}>
                  {x.head}
                </option>
              ))}
            </select>
          </label>
          <p className="text-stone-600">
            Then play the recording and press <b>Starts now</b> as each paragraph begins. You can drag the slider ahead and
            play faster: &ldquo;Jump near it&rdquo; goes to about where the next paragraph should start.
          </p>
          <button type="button" onClick={() => setStarted(true)} className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
            Start marking
          </button>
        </>
      ) : cur ? (
        <>
          <p className="text-stone-700">
            Paragraph {i + 1} of {range.length} — about {fmt(estimate)}:
          </p>
          <p dir="rtl" lang="he" className="rounded bg-white p-2 font-hebrew text-lg">
            {cur.head}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => mark()} className="rounded-lg bg-amber-700 px-5 py-2 font-semibold text-white">
              Starts now
            </button>
            <button
              type="button"
              onClick={() => {
                const a = ref.current;
                if (a) {
                  a.currentTime = Math.max(0, estimate - 6);
                  void a.play();
                }
              }}
              className="rounded-lg border px-3 py-2"
            >
              Jump near it
            </button>
            <button type="button" onClick={() => mark(true)} className="rounded-lg border px-3 py-2">
              Not in the recording
            </button>
            <button
              type="button"
              disabled={!marks.length}
              onClick={() => {
                setMarks((m) => m.slice(0, -1));
                setI((x) => Math.max(0, x - 1));
              }}
              className="rounded-lg border px-3 py-2"
            >
              Undo
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <p>All {range.length} paragraphs done.</p>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">
            Save
          </button>
        </div>
      )}
      {started && cur && marks.some(Boolean) && (
        <button type="button" onClick={() => void save()} className="text-xs text-emerald-800 underline">
          Save what I&apos;ve marked so far
        </button>
      )}
      {msg && <p className="text-stone-700">{msg}</p>}
    </div>
  );
}

/** Admin panel at the top of a Siddur part: recordings that cover several paragraphs. */
export function LongRecordingsAdmin({ part, have, paras }: { part: string; have: Set<string> | null; paras: SpokenPara[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const existing = Array.from({ length: LONG_SLOTS }, (_, k) => k + 1).filter((n) => have?.has(longPath(part, n)));
  const next = Array.from({ length: LONG_SLOTS }, (_, k) => k + 1).find((n) => !have?.has(longPath(part, n)));
  return (
    <div className="rounded-xl border border-dashed border-amber-400 bg-white p-4 text-sm" dir="ltr" data-no-translate>
      <p className="font-semibold text-stone-900">Admin: one recording of several paragraphs</p>
      <p className="mt-1 text-stone-600">
        Drop a recording that covers many paragraphs (all of Birkot HaShahar, say), then mark where each paragraph starts.
        Each one gets its own play button. A paragraph&apos;s own recording, if you upload one, comes first.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {existing.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setOpen(open === n ? null : n)}
            className={`rounded-lg border px-3 py-1.5 ${open === n ? "border-amber-600 bg-amber-50" : "border-stone-300"}`}
          >
            Recording {n}: {have?.has(longJson(part, n)) ? "re-mark paragraphs" : "mark paragraphs"}
          </button>
        ))}
        {next && <AdminDrop path={longPath(part, next)} label="Drop a long recording here" />}
      </div>
      {open !== null && <MarkTool key={open} part={part} n={open} paras={paras} onDone={() => setOpen(null)} />}
    </div>
  );
}
