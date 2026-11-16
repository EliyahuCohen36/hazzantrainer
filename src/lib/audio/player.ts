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

const SILENT =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";
let el: HTMLAudioElement | null = null;
let unlocked = false;

function player(): HTMLAudioElement {
  if (!el) {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

/** Call at the very start of a tap handler, before any await. */
export function unlockAudio() {
  const a = player();
  try {
    void audioContext().resume(); // the fallback player needs this during the tap too
  } catch {
    // no audio engine
  }
  if (unlocked) return;
  unlocked = true;
  a.src = SILENT;
  void a.play().catch(() => (unlocked = false));
}

/** Plays a list of sound URLs one after another (with `gap` seconds between). Resolves when done or stopped. */
export function playUrls(urls: string[], gap = 0): { done: Promise<void>; stop: () => void } {
  const a = player();
  let stopped = false;
  const done = (async () => {
    for (let i = 0; i < urls.length && !stopped; i++) {
      a.pause();
      a.src = urls[i];
      applySpeed(a, getSpeed());
      await new Promise<void>((resolve) => {
        const end = () => {
          a.onended = null;
          a.onerror = null;
          resolve();
        };
        a.onended = end;
        a.onerror = () => {
          a.onended = null;
          a.onerror = null;
          void engine(urls[i]).then(resolve);
        };
        // If the browser refuses the player, play it through the audio engine instead.
        a.play().catch(() => {
          a.onended = null;
          a.onerror = null;
          void engine(urls[i]).then(resolve);
        });
      });
      if (gap && i < urls.length - 1 && !stopped) await new Promise((r) => setTimeout(r, gap * 1000));
    }
  })();
  return {
    done,
    stop: () => {
      stopped = true;
      a.pause();
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
    if (ctx.state !== "running") await ctx.resume();
    const buf = await decodeAudio(ctx, await (await fetch(url)).arrayBuffer());
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = getSpeed();
    src.connect(ctx.destination);
    current?.stop();
    current = src;
    await new Promise<void>((r) => {
      src.onended = () => r();
      src.start();
    });
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
