"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { MasterTrack } from "@/hooks/useMasterTrack";

export const PLAYBACK_RATES = [0.75, 1] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

interface Props {
  track: MasterTrack;
  /** Owned by the parent so the voice trainer can start playback for sing-along. */
  audioRef: RefObject<HTMLAudioElement | null>;
  rate: PlaybackRate;
  onRateChange: (r: PlaybackRate) => void;
  onLoadFile: (file: File) => void;
  onLoadTestTone: () => void;
  defaultPath?: string;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export function MasterAudioPlayer({ track, audioRef, rate, onRateChange, onLoadFile, onLoadTestTone, defaultPath }: Props) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Apply speed; keep pitch the same when slowing down (important for learning the tune).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.defaultPlaybackRate = rate;
    a.playbackRate = rate;
    a.preservesPitch = true;
  }, [rate, audioRef, track.src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("audio/")) onLoadFile(f);
  };

  const canPlay = !!track.src && track.status !== "loading";

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-colors ${dragOver ? "border-amber-500 bg-amber-50" : "border-stone-200"}`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Master recording</h2>
        <span className="truncate text-xs text-stone-500">{track.src ? track.label : ""}</span>
      </div>

      {track.src && (
        <audio
          ref={audioRef}
          src={track.src}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.playbackRate = rate;
          }}
        />
      )}

      {canPlay ? (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white shadow hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ms-0.5 h-5 w-5 fill-current"><path d="M7 4.5v15l13-7.5z" /></svg>
            )}
          </button>

          <div className="flex min-w-48 flex-1 items-center gap-3">
            <span className="w-10 text-end text-xs tabular-nums text-stone-500">{fmt(time)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={time}
              onChange={(e) => {
                const a = audioRef.current;
                if (a) a.currentTime = Number(e.target.value);
              }}
              className="h-1.5 flex-1 accent-amber-700"
              aria-label="Seek"
            />
            <span className="w-10 text-xs tabular-nums text-stone-500">{fmt(duration)}</span>
          </div>

          <div className="flex rounded-lg border border-stone-200 p-0.5" role="group" aria-label="Playback speed">
            {PLAYBACK_RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRateChange(r)}
                aria-pressed={rate === r}
                className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums ${rate === r ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100"}`}
              >
                {r}×
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-stone-300 p-5 text-sm text-stone-600">
          {track.status === "loading" ? (
            <p>Looking for the master recording…</p>
          ) : (
            <>
              <p className="font-medium text-stone-800">No master recording yet.</p>
              <p className="mt-1">
                Save your MP3/WAV as <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">public{defaultPath}</code> and
                reload, or drop an audio file here.
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-50"
        >
          Choose audio file…
        </button>
        <button type="button" onClick={onLoadTestTone} className="rounded-lg px-3 py-1.5 text-stone-500 hover:bg-stone-100">
          Use synthetic test melody
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLoadFile(f);
            e.target.value = "";
          }}
        />
        <span className="ms-auto text-xs text-stone-500">
          {track.status === "analyzing" && `Analysing melody… ${Math.round(track.progress * 100)}%`}
          {track.status === "ready" && "Melody analysed ✓"}
          {track.status === "error" && <span className="text-rose-600">{track.error}</span>}
        </span>
      </div>
    </section>
  );
}
