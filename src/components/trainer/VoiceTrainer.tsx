"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { TextSegment } from "@/types/curriculum";
import type { MasterTrack } from "@/hooks/useMasterTrack";
import { usePitchRecorder, type LiveFrame } from "@/hooks/usePitchRecorder";
import { analyzeRecording, contourFromHz } from "@/lib/audio/contour";
import { scoreReading, type ReadingResult } from "@/lib/audio/reading-score";
import { compareContours, type ComparisonResult } from "@/lib/audio/compare";
import { foldOctave, median, pointScore } from "@/lib/audio/pitch-math";
import { AccuracyMeter } from "./AccuracyMeter";
import { PitchCanvas, type LivePoint } from "./PitchCanvas";
import { ScoreCard } from "./ScoreCard";

interface Props {
  track: MasterTrack;
  audioRef: RefObject<HTMLAudioElement | null>;
  playbackRate: number;
  segments: TextSegment[];
  /** Per-word scores for colouring the reading pane (null clears them). */
  onResult: (segmentScores: Record<string, number> | null) => void;
}

const MAX_RECORD_SEC = 90;
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (midi: number) => `${NOTE_NAMES[((Math.round(midi) % 12) + 12) % 12]}${Math.floor(Math.round(midi) / 12) - 1}`;

/**
 * Live scoring (while recording) is a quick estimate that assumes the student
 * keeps time with the master. The final score uses Dynamic Time Warping, so it
 * forgives tempo differences and judges only the melody.
 *
 * Octave and key independence, live:
 *   T = median(studentMidi − masterMidi) over frames where both are singing.
 *   T is the student's transposition (e.g. +12 for a child an octave up,
 *   +7.3 for a different key). Each frame's error is then
 *   |foldOctave(studentMidi − T − masterMidi)|.
 */
export function VoiceTrainer({ track, audioRef, playbackRate, segments, onResult }: Props) {
  const { status, error, start, stop } = usePitchRecorder();
  const [singAlong, setSingAlong] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null);
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const master = track.status === "ready" ? track.contour : null;
  const recording = status === "recording";

  // Mutable per-recording state; kept in refs to avoid 60 React renders per second.
  const live = useRef({
    points: [] as LivePoint[],
    diffs: [] as number[],
    voiced: [] as number[],
    recent: [] as number[],
    cursor: 0,
    frame: 0,
    singAlong: false,
  });
  const stopping = useRef(false);

  const onFrame = useCallback(
    (f: LiveFrame) => {
      const L = live.current;
      L.cursor = f.t;
      L.frame++;
      if (f.midi === null) {
        L.points.push({ t: f.t, v: null });
      } else {
        L.voiced.push(f.midi);
        if (L.voiced.length > 400) L.voiced.shift();

        // The master frame that should be sounding now (timing assumption).
        const mi = master ? Math.floor((f.t * (L.singAlong ? playbackRate : 1)) / master.hopSec) : -1;
        const mMidi = master && mi < master.midi.length ? master.midi[mi] : null;
        if (mMidi !== null && mMidi !== undefined) {
          L.diffs.push(f.midi - mMidi);
          if (L.diffs.length > 300) L.diffs.shift();
        }
        const T = L.diffs.length >= 8 ? median(L.diffs) : null;

        // Plot student on the master's scale once transposition is known.
        const v = master && T !== null ? f.midi - T - master.center : f.midi - median(L.voiced);
        L.points.push({ t: f.t, v });

        if (T !== null && mMidi !== null && mMidi !== undefined) {
          L.recent.push(pointScore(foldOctave(f.midi - T - mMidi)));
          if (L.recent.length > 30) L.recent.shift();
        }
      }
      // Update React state ~10×/s.
      if (L.frame % 6 === 0) {
        setLiveAccuracy(L.recent.length >= 5 ? (100 * L.recent.reduce((a, b) => a + b, 0)) / L.recent.length : null);
        setLiveNote(f.midi === null ? null : `${noteName(f.midi)} · ${Math.round(f.hz ?? 0)} Hz`);
      }
      if (f.t > MAX_RECORD_SEC) void stopRef.current();
    },
    [master, playbackRate],
  );

  const handleStart = async () => {
    setResult(null);
    setReading(null);
    setNotice(null);
    onResult(null);
    setLiveAccuracy(null);
    stopping.current = false;
    const useMaster = singAlong && !!track.src;
    live.current = { points: [], diffs: [], voiced: [], recent: [], cursor: 0, frame: 0, singAlong: useMaster };
    await start(onFrame);
    const a = audioRef.current;
    if (useMaster && a) {
      a.currentTime = 0;
      a.play().catch(() => setNotice("Couldn't start the master audio automatically. Press play on it."));
    }
  };

  const handleStop = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    setProcessing(true);
    if (live.current.singAlong) audioRef.current?.pause();
    const rec = await stop();
    setAudioUrl(rec.audioUrl);
    setLiveNote(null);

    const student = contourFromHz(
      rec.frames.map((f) => f.hz),
      rec.hopSec,
    );
    if (student.voicedSec < 0.5) {
      setNotice("I couldn't hear any singing. Check that the right microphone is selected and chant a bit louder.");
    } else if (master) {
      // Full score (melody + placement + pauses + clarity) from the recorded audio.
      let full: ReadingResult | null = null;
      if (rec.audioBlob && track.features) {
        try {
          const analysed = await analyzeRecording(await rec.audioBlob.arrayBuffer());
          if (analysed.contour.voicedSec >= 0.5) {
            full = scoreReading({ contour: master, features: track.features }, analysed, segments, track.timings);
          }
        } catch {
          // Some browsers can't decode their own recording format; fall back to melody only.
        }
      }
      if (full) {
        setReading(full);
        setResult(full.melody);
        onResult(full.segmentScores);
      } else {
        const r = compareContours(master, student, track.timings);
        setResult(r);
        onResult(r.segmentScores);
      }
    } else {
      setNotice("Recording saved. Load a master recording to get an accuracy score.");
    }
    setProcessing(false);
  }, [audioRef, stop, master, track.timings, track.features, segments, onResult]);

  // Lets onFrame and the audio "ended" event call the latest handleStop.
  const stopRef = useRef(handleStop);
  useEffect(() => {
    stopRef.current = handleStop;
  }, [handleStop]);

  // In sing-along mode, stop recording shortly after the master finishes.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !recording || !live.current.singAlong) return;
    let timer: ReturnType<typeof setTimeout>;
    const onEnded = () => {
      timer = setTimeout(() => void stopRef.current(), 1200);
    };
    a.addEventListener("ended", onEnded);
    return () => {
      a.removeEventListener("ended", onEnded);
      clearTimeout(timer);
    };
  }, [audioRef, recording]);

  const liveSource = useMemo(
    () => (recording ? { points: () => live.current.points, cursor: () => live.current.cursor } : null),
    [recording],
  );

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Voice trainer</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={singAlong}
            disabled={recording}
            onChange={(e) => setSingAlong(e.target.checked)}
            className="h-4 w-4 accent-amber-700"
          />
          Play master while I chant <span className="text-stone-400">(use headphones)</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="button"
          onClick={recording ? () => void handleStop() : () => void handleStart()}
          disabled={status === "requesting" || processing}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-50 ${
            recording ? "bg-stone-800 hover:bg-stone-900" : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          {recording ? (
            <span className="h-5 w-5 rounded-sm bg-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
            </svg>
          )}
        </button>

        <div className="min-w-56 flex-1">
          {master ? (
            <AccuracyMeter
              value={recording ? liveAccuracy : (reading?.overall ?? result?.score ?? null)}
              label={recording ? "Live melody accuracy (estimate)" : reading ? "Final score" : result ? "Final accuracy" : "Accuracy"}
            />
          ) : (
            <p className="text-sm text-stone-500">
              Load a master recording to be scored. You can still record and see your pitch.
            </p>
          )}
          <p className="mt-2 h-5 text-sm text-stone-500" aria-live="polite">
            {status === "requesting" && "Waiting for microphone permission…"}
            {recording && (liveNote ? <span className="tabular-nums text-indigo-700">♪ {liveNote}</span> : "Listening…")}
            {processing && "Scoring your reading…"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PitchCanvas
          master={master}
          timeScale={recording && live.current.singAlong ? 1 / playbackRate : 1}
          live={liveSource}
          result={!recording && result ? { aligned: result.aligned, errors: result.alignedError } : null}
        />
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-stone-400" />Master melody</span>
          {recording ? (
            <span className="flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-indigo-600" />You (live)</span>
          ) : result ? (
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-5 rounded bg-gradient-to-r from-emerald-600 via-amber-600 to-rose-600" />You, aligned (in tune → off)
            </span>
          ) : null}
          <span className="ms-auto">Pitch is relative, so any voice range or octave works.</span>
        </div>
      </div>

      {(error || notice) && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>
          {error ?? notice}
        </p>
      )}

      {result && !recording && (
        <div className="mt-5">
          <ScoreCard result={result} reading={reading} audioUrl={audioUrl} />
        </div>
      )}
    </section>
  );
}
