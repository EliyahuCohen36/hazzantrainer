"use client";

import { useRef, useState } from "react";
import { beginnerPlaylist } from "@/data/beginner-recordings";
import { recordingUrl } from "@/lib/recordings";
import { playUrls, unlockAudio } from "@/lib/audio/player";

const COLORS: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950",
  sky: "border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-950",
  emerald: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950",
  rose: "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-950",
  violet: "border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-950",
  stone: "border-stone-200 bg-white hover:bg-stone-50 text-stone-900",
};

/**
 * A big tile with a letter (or a letter with a nekuda), its name or sound, and,
 * when the Hazzan has recorded it, a tap to hear it.
 */
export function Tile({
  glyph,
  label,
  sub,
  rec,
  color = "stone",
  size = "lg",
  still = false,
}: {
  glyph: string;
  label: string;
  sub?: string;
  /** Key in BEGINNER_RECORDINGS, e.g. "letter:bet". */
  rec?: string;
  color?: string;
  size?: "lg" | "md";
  /** Show only (no tap to hear), e.g. inside a link. */
  still?: boolean;
}) {
  const list = rec && !still ? beginnerPlaylist(rec) : [];
  const src = list[0];
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<() => void>(() => {});

  // Plays the recordings one after another (a plain letter: its name, then its sound).
  const play = async () => {
    if (!src) return;
    unlockAudio(); // must happen during the tap (Safari)
    stopRef.current();
    setPlaying(true);
    try {
      const urls = await Promise.all(list.map((p) => recordingUrl(p)));
      const p = playUrls(urls, 0.35);
      stopRef.current = p.stop;
      await p.done;
    } finally {
      setPlaying(false);
    }
  };

  const Tag = still ? "div" : "button";
  return (
    <Tag
      {...(still ? {} : { type: "button" as const, onClick: play, disabled: !src })}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 shadow-sm transition-transform disabled:cursor-default ${
        src ? "active:scale-95" : ""
      } ${COLORS[color] ?? COLORS.stone} ${playing ? "ring-4 ring-amber-300" : ""}`}
      aria-label={`${label}${sub ? `, ${sub}` : ""}${src ? ", play" : ""}`}
    >
      <span
        dir="rtl"
        lang="he"
        className={`font-hebrew leading-none ${size === "lg" ? "text-6xl sm:text-7xl" : "text-5xl"} py-3`}
      >
        {glyph}
      </span>
      <span className="mt-1 text-sm font-semibold">{label}</span>
      {sub && <span className="text-xs opacity-70">{sub}</span>}
      {src && <span className="absolute top-1.5 right-2 text-sm opacity-60 group-hover:opacity-100">🔊</span>}
    </Tag>
  );
}
