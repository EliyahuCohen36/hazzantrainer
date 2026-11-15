"use client";

import type { TextSegment } from "@/types/curriculum";
import { renderHebrew } from "@/lib/hebrew/marks";
import { getTaam } from "@/lib/hebrew/teamim";
import type { ReaderSettings } from "./DisplayModeToggle";

interface Props {
  segments: TextSegment[];
  settings: ReaderSettings;
  /** Word currently sounding in the master recording. */
  activeSegmentId?: string | null;
  /** Per-word scores (0–100) after an attempt; colours the words. */
  segmentScores?: Record<string, number>;
  /** Clicking a word seeks the master audio to it. */
  onSegmentClick?: (segmentId: string) => void;
}

function scoreColor(score: number | undefined): string {
  if (score === undefined) return "";
  if (score >= 80) return "text-emerald-700";
  if (score >= 55) return "text-amber-600";
  return "text-rose-600";
}

/**
 * Right-to-left reading pane. Each word is its own element so it can be
 * highlighted during playback, coloured by score, and clicked to seek.
 */
export function HebrewReader({ segments, settings, activeSegmentId, segmentScores, onSegmentClick }: Props) {
  const opts = settings.scrollMode
    ? { showNikkud: false, showTeamim: false }
    : { showNikkud: settings.showNikkud, showTeamim: settings.showTeamim };
  const showNames = !settings.scrollMode && settings.showTaamNames;

  return (
    <div
      dir="rtl"
      lang="he"
      className={`hebrew-text rounded-2xl px-6 py-10 text-center transition-colors sm:px-10 ${
        settings.scrollMode
          ? "bg-[#f6eedd] font-scroll text-[2.6rem] font-medium leading-[2] text-stone-900 shadow-[inset_0_0_40px_rgba(120,90,40,0.15)] sm:text-[3.2rem]"
          : "bg-white font-hebrew text-[2.4rem] leading-[2.4] text-stone-900 sm:text-[3rem]"
      }`}
    >
      {segments.map((seg) => {
        const taam = getTaam(seg.taam);
        const active = seg.id === activeSegmentId;
        const score = segmentScores?.[seg.id];
        return (
          <span key={seg.id} className="inline-flex flex-col items-center align-top">
            <span
              role={onSegmentClick ? "button" : undefined}
              tabIndex={onSegmentClick ? 0 : undefined}
              onClick={() => onSegmentClick?.(seg.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSegmentClick?.(seg.id)}
              title={taam && !settings.scrollMode ? `${taam.syrian} (${taam.standard})` : undefined}
              className={`mx-[0.18em] rounded-lg px-[0.12em] transition-colors ${onSegmentClick ? "cursor-pointer hover:bg-amber-50" : ""} ${
                active ? "bg-amber-200/70" : ""
              } ${scoreColor(score)}`}
            >
              {renderHebrew(seg.text, opts)}
            </span>
            {showNames && taam && (
              <span className="-mt-3 font-sans text-xs leading-tight text-stone-500" dir="ltr">
                {taam.syrian}
                {score !== undefined && <span className={`ms-1 font-semibold ${scoreColor(score)}`}>{score}</span>}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
