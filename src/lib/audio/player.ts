"use client";

import { applySpeed, getSpeed } from "./speed";
import { audioContext } from "./join-syllables";
import { decodeAudio } from "./decode";

/**
 * One shared audio player for tap-to-hear sounds.
 *
 * Safari (on the Mac especially) only lets a page play sound straight from a
 * tap. Our sounds are fetched or built first (a moment after the tap), so a new
 * player started then was silently blocked. Instead, one player is "unlocked"
 * during the tap itself (playing a tiny silent sound), and every sound after
 * that plays through it.
 */

/** A tenth of a second of real silence (a WAV with samples: Safari rejects an empty one). */
function silentWav(): string {
  const n = 800; // 0.1 s at 8 kHz, 8-bit
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const str = (o: number, t: string) => [...t].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + n, true);
  str(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, n, true);
  b.fill(128, 44);
  let bin = "";
  b.forEach((x) => (bin += String.fromCharCode(x)));
  return "data:audio/wav;base64," + btoa(bin);
}

let el: HTMLAudioElement | null = null;
let unlocked = false;

function player(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
    el.setAttribute("playsinline", "");
  }
  return el;
}

/** Call at the very start of a tap handler, before any await. */
export function unlockAudio() {
  // 1. The audio engine: resume it and play one silent sample during the tap
  //    (after that it can play by itself, e.g. when a question opens).
  try {
    const ctx = audioContext();
    void ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, 22050);
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // no audio engine
  }
  // 2. The player: play a short silence during the tap.
  if (unlocked) return;
  unlocked = true;
  const a = player();
  a.src = silentWav();
  a.play().catch((e: unknown) => {
    // Interrupted by the real sound: that's fine, the tap still counted.
    if (!(e instanceof DOMException && e.name === "AbortError")) unlocked = false;
  });
}

const wait = (ms: number) => new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms));

/**
 * Plays one sound through the player; if the browser refuses it, it doesn't
 * start within a few seconds, or it fails, plays it through the audio engine.
 * Never hangs: every step has a time limit.
 */
async function playOne(url: string, isStopped: () => boolean): Promise<void> {
  const a = player();
  a.pause();
  a.onended = a.onerror = a.onplaying = null;
  a.src = url;
  applySpeed(a, getSpeed());
  const started = new Promise<"ok" | "fail">((resolve) => {
    a.onplaying = () => resolve("ok");
    a.onerror = () => resolve("fail");
    a.play().catch(() => resolve("fail"));
  });
  const how = await Promise.race([started, wait(4000)]);
  if (isStopped()) return;
  if (how !== "ok") {
    a.pause();
    a.onended = a.onerror = a.onplaying = null;
    return engine(url);
  }
  const ended = new Promise<void>((resolve) => {
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.onpause = () => resolve();
  });
  const limit = (Number.isFinite(a.duration) && a.duration > 0 ? a.duration / getSpeed() + 2 : 20) * 1000;
  await Promise.race([ended, wait(limit)]);
  a.onended = a.onerror = a.onplaying = a.onpause = null;
}

/** Plays a list of sound URLs one after another (with `gap` seconds between). Resolves when done or stopped. */
export function playUrls(urls: string[], gap = 0): { done: Promise<void>; stop: () => void } {
  let stopped = false;
  const done = (async () => {
    for (let i = 0; i < urls.length && !stopped; i++) {
      await playOne(urls[i], () => stopped);
      if (gap && i < urls.length - 1 && !stopped) await new Promise((r) => setTimeout(r, gap * 1000));
    }
  })();
  return {
    done,
    stop: () => {
      stopped = true;
      el?.pause();
      try {
        current?.stop();
      } catch {
        // already stopped
      }
    },
  };
}

let current: AudioBufferSourceNode | null = null;
/** Fallback: play through the Web Audio engine (resumed during the tap). */
async function engine(url: string): Promise<void> {
  try {
    const ctx = audioContext();
    if (ctx.state !== "running") await Promise.race([ctx.resume(), wait(1500)]);
    const data = await Promise.race([fetch(url).then((r) => r.arrayBuffer()), wait(8000)]);
    if (data === "timeout") return;
    const buf = await decodeAudio(ctx, data);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = getSpeed();
    src.connect(ctx.destination);
    current?.stop();
    current = src;
    await Promise.race([
      new Promise<void>((r) => {
        src.onended = () => r();
        src.start();
      }),
      wait((buf.duration / getSpeed() + 1) * 1000),
    ]);
  } catch {
    // nothing more we can do
  }
}

export function stopAudio() {
  try {
    current?.stop();
  } catch {
    // already stopped
  }
  el?.pause();
}

// Unlock on the first tap or click anywhere, so sounds that play by themselves
// (e.g. "Listen and pick" playing the word when the question opens) aren't blocked.
if (typeof window !== "undefined") {
  const once = () => {
    unlockAudio();
    if (unlocked) {
      window.removeEventListener("click", once, true);
      window.removeEventListener("touchend", once, true);
    }
  };
  window.addEventListener("click", once, true);
  window.addEventListener("touchend", once, true);
}
