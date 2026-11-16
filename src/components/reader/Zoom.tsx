"use client";

import { useEffect, useState } from "react";

/** Text size steps for the Tanakh text (1 = normal). */
export const ZOOM_STEPS = [0.8, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];
const KEY = "kriah-text-zoom";

/** The reader's text size, remembered per browser. */
export function useZoom(): [number, (z: number) => void] {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    try {
      const z = Number(localStorage.getItem(KEY));
      if (ZOOM_STEPS.includes(z)) setZoom(z);
    } catch {
      // storage blocked: keep normal size
    }
  }, []);
  const set = (z: number) => {
    setZoom(z);
    try {
      localStorage.setItem(KEY, String(z));
    } catch {
      // ignore
    }
  };
  return [zoom, set];
}

/** − 100% + buttons for the text size. */
export function ZoomControl({ zoom, onChange }: { zoom: number; onChange: (z: number) => void }) {
  const i = ZOOM_STEPS.indexOf(zoom);
  const btn =
    "flex size-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-lg font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-40";
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
      <span className="me-1 text-sm font-medium text-stone-700">Text size</span>
      <button type="button" className={btn} onClick={() => onChange(ZOOM_STEPS[i - 1])} disabled={i <= 0} aria-label="Smaller text">
        −
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        className="min-w-14 rounded-lg px-1 text-center text-sm tabular-nums text-stone-600 hover:bg-stone-100"
        title="Back to normal size"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(ZOOM_STEPS[i + 1])}
        disabled={i >= ZOOM_STEPS.length - 1}
        aria-label="Bigger text"
      >
        +
      </button>
    </div>
  );
}

/**
 * Lets the text grow past the page's normal width when it's zoomed, so a big
 * screen is filled (centred, never wider than the window).
 */
export function zoomWidth(zoom: number, base = 56): React.CSSProperties {
  if (zoom <= 1) return {};
  return {
    width: `min(calc(100vw - 2rem), ${base * zoom}rem)`,
    position: "relative",
    left: "50%",
    transform: "translateX(-50%)",
  };
}
