"use client";

import { useEffect, useState, type RefObject } from "react";
import type { MasterTrack } from "@/hooks/useMasterTrack";
import { SpeedControl } from "./SpeedControl";
import { applySpeed } from "@/lib/audio/speed";

interface Props {
  track: MasterTrack;
  /** Owned by the parent so the voice trainer can start playback for sing-along. */
  audioRef: RefObject<HTMLAudioElement | null>;
  rate: number;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

export function MasterAudioPlayer({ track, audioRef, rate }: Props) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Apply speed; keep pitch the same when slowing down (important for learning the tune).
  useEffect(() => {
    applySpeed(audioRef.current, rate);
  }, [rate, audioRef, track.src]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const canPlay = !!track.src && track.status !== "loading";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">The Hazzan&apos;s recording</h2>
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
            applySpeed(e.currentTarget, rate);
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

        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-stone-300 p-5 text-sm text-stone-600">
          {track.status === "loading" ? (
            <p>Looking for the master recording…</p>
          ) : (
            <p className="font-medium text-stone-800">The Hazzan&apos;s recording for this pasuk isn&apos;t available yet.</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SpeedControl />
        <span className="ms-auto text-xs text-stone-500">
          {track.status === "analyzing" && `Getting the tune ready… ${Math.round(track.progress * 100)}%`}
          {track.status === "ready" && "Ready ✓"}
          {track.status === "error" && <span className="text-rose-600">{track.error}</span>}
        </span>
      </div>
    </section>
  );
}
