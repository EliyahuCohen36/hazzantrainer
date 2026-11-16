"use client";

/**
 * Checks whether a child said a Hebrew word, using the browser's speech
 * recognition in Hebrew (Chrome, Edge, and Safari on iPhone, iPad and Mac;
 * free, nothing to install). Firefox has none: there the grown-up marks it.
 *
 * Speech recognition writes what it heard without nekudot, so the check compares
 * letters: the word's letters must match what was heard. It is forgiving about
 * letters that sound alike to a recogniser (א/ע, ה/ח, כ/ק, ת/ט, ס/שׂ, ב/ו) and about
 * spelling with or without a vav or yod, because children's speech is hard to
 * recognise and a wrong "✗" discourages them more than a lenient "✓".
 */

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechend?: (() => void) | null;
  onsoundstart?: (() => void) | null;
};

function ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canCheckSpeech = () => ctor() !== null;

const FINAL: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
const ALIKE: Record<string, string> = { ע: "א", ח: "ה", ק: "כ", ט: "ת", ס: "ש", ו: "ב" };

/** The letters of a word, simplified so that look-alike spellings compare equal. */
export function skeleton(word: string): string {
  const letters = [...word.normalize("NFD")].filter((c) => c >= "א" && c <= "ת").map((c) => FINAL[c] ?? c);
  // Drop vav and yod used as vowels (spelled with or without them), keep a first letter.
  const core = letters.filter((c, i) => i === 0 || (c !== "ו" && c !== "י"));
  return core.map((c) => ALIKE[c] ?? c).join("");
}

function close(a: string, b: string): boolean {
  if (a === b) return true;
  // One letter different, missing or extra, for words of 3+ letters.
  if (Math.min(a.length, b.length) < 3 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/** Did any of the heard phrases contain the word? */
export function heardWord(target: string, heard: string[]): boolean {
  const t = skeleton(target);
  const tails = ["", "ה", "ו"];
  return heard.some((phrase) =>
    phrase
      .split(/[\s\-־,.!?]+/)
      .filter(Boolean)
      .concat(phrase.replace(/\s+/g, ""))
      .some((w) => {
        const s = skeleton(w);
        return close(s, t) || tails.some((x) => s === t + x || s + x === t);
      }),
  );
}

export type ListenResult = { ok: boolean; heard: string[] } | { ok: null; reason: "nothing" | "denied" | "unsupported" };

/**
 * Listens for the word (up to `ms`) and says whether it was said.
 * Uses every guess the recogniser makes, including its quick in-between guesses
 * (short single words often never get a "final" guess, especially on iPhone),
 * and keeps listening a moment after the child stops, so the end of the word isn't lost.
 * `onSound` is called when the microphone first hears something.
 */
export function listenFor(target: string, ms = 7000, onSound?: () => void): { done: Promise<ListenResult>; stop: () => void } {
  const C = ctor();
  if (!C) return { done: Promise.resolve({ ok: null, reason: "unsupported" }), stop: () => {} };
  const r = new C();
  r.lang = "he-IL";
  r.interimResults = true;
  r.maxAlternatives = 5;
  r.continuous = true;
  const heard: string[] = [];
  let settled = false;
  let denied = false;
  let after: ReturnType<typeof setTimeout> | null = null;
  const done = new Promise<ListenResult>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (after) clearTimeout(after);
      if (heardWord(target, heard)) resolve({ ok: true, heard });
      else if (denied) resolve({ ok: null, reason: "denied" });
      else if (!heard.length) resolve({ ok: null, reason: "nothing" });
      else resolve({ ok: false, heard });
    };
    const stopSoon = (wait: number) => {
      if (after) clearTimeout(after);
      after = setTimeout(() => {
        try {
          r.stop();
        } catch {
          finish();
        }
        // Some browsers never fire "end" after stop(); don't wait for ever.
        setTimeout(finish, 1500);
      }, wait);
    };
    r.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++)
        for (let k = 0; k < e.results[i].length; k++) {
          const t = e.results[i][k].transcript.trim();
          if (t) heard.push(t);
        }
      if (heardWord(target, heard)) stopSoon(0);
      else stopSoon(1600); // wait for more after the last thing heard
    };
    r.onsoundstart = () => onSound?.();
    r.onspeechend = () => stopSoon(900);
    r.onerror = (e) => {
      // No microphone, no permission, or this browser can't do Hebrew: fall back to a grown-up.
      if (["not-allowed", "service-not-allowed", "audio-capture", "language-not-supported", "network"].includes(e.error)) denied = true;
    };
    r.onend = finish;
    const timer = setTimeout(() => stopSoon(0), ms);
    try {
      r.start();
    } catch {
      finish();
    }
  });
  return {
    done,
    stop: () => {
      try {
        r.stop();
      } catch {
        // already stopped
      }
      setTimeout(() => {
        if (!settled) r.onend?.();
      }, 1500);
    },
  };
}
