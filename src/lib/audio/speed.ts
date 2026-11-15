"use client";

import { useSyncExternalStore } from "react";

/**
 * One playback speed for all of the Hazzan's recordings, remembered in this
 * browser. Pitch stays the same at every speed (preservesPitch), so slowing
 * down doesn't change the tune.
 */
export const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const SPEED_MIN = 0.25;
export const SPEED_MAX = 3;

const KEY = "kriah-playback-speed";
const listeners = new Set<() => void>();
let current = 1;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = Number(localStorage.getItem(KEY));
    if (v >= SPEED_MIN && v <= SPEED_MAX) current = v;
  } catch {
    // ignore
  }
}

export function getSpeed() {
  load();
  return current;
}

export function setSpeed(v: number) {
  current = Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(v * 100) / 100));
  try {
    localStorage.setItem(KEY, String(current));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useSpeed(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSpeed,
    () => 1,
  );
}

/** Apply the speed to an audio element (keeping the pitch). */
export function applySpeed(a: HTMLAudioElement | null, rate: number) {
  if (!a) return;
  a.preservesPitch = true;
  a.defaultPlaybackRate = rate;
  a.playbackRate = rate;
}
