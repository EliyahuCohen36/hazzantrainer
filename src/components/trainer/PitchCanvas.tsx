"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PitchContour } from "@/lib/audio/contour";
import type { MaybeNumber } from "@/lib/audio/pitch-math";

export interface LivePoint {
  t: number;
  /** Semitones relative to the master's centre, or null if silent. */
  v: number | null;
}

interface Props {
  master: PitchContour | null;
  /** Multiplies master time. Live sing-along at 0.75× → 1/0.75. */
  timeScale?: number;
  /** While recording: called every animation frame to get the latest student points. */
  live?: { points: () => LivePoint[]; cursor: () => number } | null;
  /** After recording: student's DTW-aligned pitch on the master's frames. */
  result?: { aligned: MaybeNumber[]; errors: MaybeNumber[] } | null;
  height?: number;
}

const RANGE = 12; // ± semitones shown
const GAP_SEC = 0.15; // break the line across gaps longer than this

/**
 * Pitch graph: time left→right, relative pitch (semitones) bottom→top.
 * Grey = master melody; blue = student (live); green/amber/red = student after alignment, by accuracy.
 * Drawn on a canvas because it updates 60×/second while recording.
 */
export function PitchCanvas({ master, timeScale = 1, live, result, height = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cursor = live?.cursor() ?? 0;
    const masterDur = master ? master.duration * timeScale : 0;
    const total = Math.max(masterDur, cursor + 0.5, 3);
    const pad = 10;
    const x = (t: number) => (t / total) * w;
    const y = (v: number) => h / 2 - (Math.max(-RANGE, Math.min(RANGE, v)) / RANGE) * (h / 2 - pad);

    // Grid: a line every 2 semitones, centre line darker.
    for (let s = -RANGE; s <= RANGE; s += 2) {
      ctx.strokeStyle = s === 0 ? "#d6d3d1" : "#f1efed";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y(s));
      ctx.lineTo(w, y(s));
      ctx.stroke();
    }

    const strokeSeries = (pts: LivePoint[], color: string | ((i: number) => string), width: number) => {
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (a.v === null || b.v === null || b.t - a.t > GAP_SEC) continue;
        ctx.strokeStyle = typeof color === "string" ? color : color(i);
        ctx.beginPath();
        ctx.moveTo(x(a.t), y(a.v));
        ctx.lineTo(x(b.t), y(b.v));
        ctx.stroke();
      }
    };

    if (master) {
      const pts = master.relative.map((v, i) => ({ t: i * master.hopSec * timeScale, v }));
      strokeSeries(pts, "#a8a29e", 4);
    }

    if (result && master) {
      const pts = result.aligned.map((v, i) => ({ t: i * master.hopSec * timeScale, v }));
      strokeSeries(
        pts,
        (i) => {
          const e = result.errors[i] ?? 0;
          return e <= 1 ? "#059669" : e <= 2.5 ? "#d97706" : "#e11d48";
        },
        2.5,
      );
    }

    if (live) {
      strokeSeries(live.points(), "#4f46e5", 2.5);
      ctx.strokeStyle = "rgba(79,70,229,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x(cursor), 0);
      ctx.lineTo(x(cursor), h);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = "#a8a29e";
    ctx.font = "10px ui-sans-serif, system-ui";
    ctx.fillText("+12", 4, y(RANGE) + 10);
    ctx.fillText("0", 4, y(0) - 3);
    ctx.fillText("−12", 4, y(-RANGE) - 3);
  }, [master, timeScale, live, result]);

  // Redraw on size change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // Animate while live, otherwise draw once.
  useEffect(() => {
    if (!live) {
      draw();
      return;
    }
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, live]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className="block w-full rounded-xl border border-stone-200 bg-stone-50/60"
      role="img"
      aria-label="Pitch graph comparing your voice to the master melody"
    />
  );
}
