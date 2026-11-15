"use client";

import { SPEED_MAX, SPEED_MIN, SPEED_PRESETS, setSpeed, useSpeed } from "@/lib/audio/speed";

const label = (v: number) => `${Number.isInteger(v) ? v.toFixed(1) : v}×`;

/** Speed for the Hazzan's recordings: quick buttons plus a slider for any speed in between. */
export function SpeedControl({ compact = false }: { compact?: boolean }) {
  const speed = useSpeed();
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="font-medium text-stone-700">
        Speed <span className="inline-block w-12 tabular-nums text-amber-800">{label(speed)}</span>
      </span>
      <input
        type="range"
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={0.05}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="h-1.5 w-40 accent-amber-700 sm:w-52"
        aria-label="Playback speed"
        list="speed-marks"
      />
      <datalist id="speed-marks">
        {SPEED_PRESETS.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <div className="flex flex-wrap rounded-lg border border-stone-200 p-0.5" role="group" aria-label="Speed presets">
        {SPEED_PRESETS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSpeed(v)}
            aria-pressed={speed === v}
            className={`rounded-md px-2 py-1 font-medium tabular-nums ${speed === v ? "bg-stone-800 text-white" : "text-stone-600 hover:bg-stone-100"}`}
          >
            {v}×
          </button>
        ))}
      </div>
    </div>
  );
}
