"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitchRecorder, type LiveFrame } from "@/hooks/usePitchRecorder";
import { analyzeRecording, type AnalyzedRecording } from "@/lib/audio/contour";
import { practiceFeedback, recordPractice, loadProgress, scoreTaamPractice, type PracticeFeedback } from "@/lib/audio/taam-practice";
import { recordingUrl } from "@/lib/recordings";
import { PitchCanvas } from "@/components/trainer/PitchCanvas";
import type { MaybeNumber } from "@/lib/audio/pitch-math";

/** The Hazzan's recordings, analysed once per page. */
const masters = new Map<string, Promise<AnalyzedRecording>>();
function loadMaster(src: string) {
  if (!masters.has(src)) {
    masters.set(
      src,
      recordingUrl(src)
        .then((u) => fetch(u))
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer();
        })
        .then((b) => analyzeRecording(b)),
    );
  }
  masters.get(src)!.catch(() => masters.delete(src));
  return masters.get(src)!;
}

type Phase = "closed" | "ready" | "recording" | "scoring" | "done";

interface Props {
  /** Recording to practise against (site path). */
  src: string;
  /** What the child is singing, e.g. "Tarha" or "Shofar Holekh before Atnah". */
  label: string;
}

/**
 * "Practice" for one ta'am: the child sings, the site compares with the
 * Hazzan's recording (tune, any voice or octave) and gives stars and tips.
 */
export function TaamPractice({ src, label }: Props) {
  const { status, error, start, stop } = usePitchRecorder();
  const [phase, setPhase] = useState<Phase>("closed");
  const [master, setMaster] = useState<AnalyzedRecording | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [aligned, setAligned] = useState<{ aligned: MaybeNumber[]; errors: MaybeNumber[] } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timing = useRef({ started: 0, lastVoice: 0, voiced: 0 });
  const stopping = useRef(false);

  useEffect(() => {
    setBest(loadProgress().practice[src] ?? null);
  }, [src]);

  const open = async () => {
    setPhase("ready");
    try {
      setMaster(await loadMaster(src));
    } catch {
      setNotice("Couldn't load the Hazzan's recording. Check your connection and try again.");
    }
  };

  const finish = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    setPhase("scoring");
    const rec = await stop();
    setAudioUrl(rec.audioUrl);
    try {
      const m = master ?? (await loadMaster(src));
      if (!rec.audioBlob) throw new Error("no audio");
      const student = await analyzeRecording(await rec.audioBlob.arrayBuffer());
      if (student.contour.voicedSec < 0.3) {
        setNotice("I couldn't hear you. Sing a little louder, close to the microphone.");
        setPhase("ready");
        return;
      }
      const scored = scoreTaamPractice(m, student);
      const fb = practiceFeedback(m.contour, scored, label);
      setFeedback(fb);
      setAligned({ aligned: scored.result.melody.aligned, errors: scored.result.melody.alignedError });
      setBest(recordPractice(src, fb.score));
      setPhase("done");
    } catch {
      setNotice("Something went wrong while scoring. Please try again.");
      setPhase("ready");
    }
  }, [stop, master, src, label]);

  // Stop by itself after the child finishes (1.2 s of quiet), or after a time limit.
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);
  const onFrame = useCallback((f: LiveFrame) => {
    const T = timing.current;
    if (f.hz !== null) {
      T.voiced += 1;
      T.lastVoice = f.t;
    }
    const limit = Math.max(8, (master?.contour.duration ?? 4) * 2.5);
    if ((T.voiced > 15 && f.t - T.lastVoice > 1.2) || f.t > limit) void finishRef.current();
  }, [master]);

  const sing = async () => {
    setFeedback(null);
    setAligned(null);
    setNotice(null);
    stopping.current = false;
    timing.current = { started: 0, lastVoice: 0, voiced: 0 };
    setPhase("recording");
    await start(onFrame);
  };

  if (phase === "closed") {
    return (
      <button
        type="button"
        onClick={() => void open()}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-rose-700"
      >
        <span aria-hidden>🎤</span> Practice{best !== null && <span className="opacity-80">· best {best}</span>}
      </button>
    );
  }

  const recording = phase === "recording" && status === "recording";
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recording ? () => void finish() : () => void sing()}
          disabled={phase === "scoring" || status === "requesting" || !master}
          aria-label={recording ? "Stop" : "Sing"}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow transition disabled:opacity-50 ${
            recording ? "animate-pulse bg-stone-800" : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {recording ? <span className="h-4 w-4 rounded-sm bg-white" /> : <span className="text-xl" aria-hidden>🎤</span>}
        </button>
        <div className="min-w-40 flex-1 text-sm text-stone-700">
          {!master && !notice && "Getting the Hazzan's recording ready…"}
          {master && phase === "ready" && (
            <>
              Listen to the Hazzan first, then press <b>🎤</b> and sing the <b>{label}</b>.
            </>
          )}
          {recording && "Listening… sing now. It stops by itself when you finish."}
          {phase === "scoring" && "Checking your singing…"}
          {phase === "done" && feedback && (
            <span className="text-base font-semibold text-stone-900">{feedback.headline}</span>
          )}
        </div>
        <button type="button" onClick={() => setPhase("closed")} className="text-xs text-stone-400 hover:text-stone-600">
          Close
        </button>
      </div>

      {(error || notice) && <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-sm text-amber-900">{error ?? notice}</p>}

      {phase === "done" && feedback && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-3xl leading-none tracking-wider text-amber-500" aria-label={`${feedback.stars} of 3 stars`}>
              {"★".repeat(feedback.stars)}
              <span className="text-stone-300">{"★".repeat(3 - feedback.stars)}</span>
            </div>
            <div className="text-sm text-stone-600">
              Score <b className="tabular-nums text-stone-900">{feedback.score}</b>
              {best !== null && <span className="text-stone-400"> · your best {best}</span>}
            </div>
            {audioUrl && <audio src={audioUrl} controls className="h-8 w-full sm:w-56" />}
          </div>
          {feedback.tips.length > 0 && (
            <ul className="list-disc space-y-0.5 ps-5 text-sm text-stone-700">
              {feedback.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <PitchCanvas master={master?.contour ?? null} result={aligned} height={120} />
          <p className="text-xs text-stone-400">Grey line: the Hazzan&apos;s tune. Coloured line: you (green = right on).</p>
          <button
            type="button"
            onClick={() => void sing()}
            className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
