"use client";

import { recordingUrl } from "@/lib/recordings";

/**
 * Joins the Hazzan's syllable recordings into one smooth word: each clip's
 * silence is trimmed off, and each syllable flows into the next with a short
 * cross-fade, so "da" + "va" + "r" sounds like one word ("davar") instead of
 * three separate sounds. The result is a WAV blob URL, played like any other
 * recording (so the speed control still works, with the pitch kept).
 */

const OVERLAP = 0.03; // seconds of cross-fade between syllables
// Each syllable is kept whole (the owner found shortened syllables too fast to
// understand); only very long ones are trimmed a little.
const MAX_MIDDLE = 0.65; // a syllable in the middle of a word
const MAX_LAST = 0.8; // the last syllable
const MAX_ALONE = 0.45; // a letter with no nekuda (e.g. the ר at the end of דָּבָר)
const cache = new Map<string, Promise<string>>();
let ctx: AudioContext | null = null;

export function audioContext() {
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

async function decode(path: string): Promise<AudioBuffer> {
  const url = await recordingUrl(path);
  const data = await (await fetch(url)).arrayBuffer();
  return await audioContext().decodeAudioData(data);
}

/** The voiced part of a clip: from where the sound starts to where it ends. */
function voiced(buf: AudioBuffer): Float32Array {
  const x = buf.getChannelData(0);
  const win = Math.round(buf.sampleRate * 0.01);
  const rms: number[] = [];
  for (let i = 0; i + win <= x.length; i += win) {
    let s = 0;
    for (let j = i; j < i + win; j++) s += x[j] * x[j];
    rms.push(Math.sqrt(s / win));
  }
  const peak = Math.max(...rms, 1e-6);
  const on = rms.findIndex((r) => r > peak * 0.06);
  let off = rms.length - 1;
  while (off > on && rms[off] < peak * 0.04) off--;
  const start = Math.max(0, (on - 1) * win);
  const end = Math.min(x.length, (off + 2) * win);
  return x.slice(start, end);
}

function toWav(samples: Float32Array, rate: number): Blob {
  const out = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  out.setUint32(4, 36 + samples.length * 2, true);
  w(8, "WAVE");
  w(12, "fmt ");
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, 1, true);
  out.setUint32(24, rate, true);
  out.setUint32(28, rate * 2, true);
  out.setUint16(32, 2, true);
  out.setUint16(34, 16, true);
  w(36, "data");
  out.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return new Blob([out], { type: "audio/wav" });
}

async function buildSamples(paths: string[]): Promise<{ samples: Float32Array; rate: number }> {
  const bufs = await Promise.all(paths.map(decode));
  const rate = bufs[0].sampleRate;
  const parts = bufs.map((b, k) => {
    const v = voiced(b);
    const max = paths[k].includes("-alone") ? MAX_ALONE : k === bufs.length - 1 ? MAX_LAST : MAX_MIDDLE;
    if (bufs.length === 1) return v;
    const keep = Math.round(max * rate);
    if (v.length <= keep) return v;
    // Fade out the end of the cut part so it doesn't click.
    const cut = v.slice(0, keep);
    const fade = Math.min(Math.round(0.04 * rate), keep);
    for (let i = 0; i < fade; i++) cut[keep - 1 - i] *= i / fade;
    return cut;
  });
  const ov = Math.round(OVERLAP * rate);
  const lead = Math.round(0.05 * rate);
  const total = lead + parts.reduce((n, p) => n + p.length, 0) - ov * (parts.length - 1) + lead;
  const out = new Float32Array(Math.max(total, 1));
  let at = lead;
  parts.forEach((p, k) => {
    const fadeIn = k > 0 ? Math.min(ov, p.length) : 0;
    const fadeOut = k < parts.length - 1 ? Math.min(ov, p.length) : 0;
    for (let i = 0; i < p.length; i++) {
      let g = 1;
      if (i < fadeIn) g = Math.sin(((i / fadeIn) * Math.PI) / 2);
      const fromEnd = p.length - 1 - i;
      if (fromEnd < fadeOut) g *= Math.sin(((fromEnd / fadeOut) * Math.PI) / 2);
      out[at + i] += p[i] * g;
    }
    at += p.length - (k < parts.length - 1 ? Math.min(ov, p.length) : 0);
  });
  return { samples: out, rate };
}

const sampleCache = new Map<string, Promise<{ samples: Float32Array; rate: number }>>();
/** The joined word as raw samples (for comparing with a child's voice). */
export function joinedWordSamples(paths: string[]) {
  const key = paths.join("|");
  if (!sampleCache.has(key)) {
    const p = buildSamples(paths);
    p.catch(() => sampleCache.delete(key));
    sampleCache.set(key, p);
  }
  return sampleCache.get(key)!;
}

async function build(paths: string[]): Promise<string> {
  const { samples, rate } = await joinedWordSamples(paths);
  return URL.createObjectURL(toWav(samples, rate));
}

/** A playable URL of the whole word, joined from its syllable recordings. */
export function joinedWordUrl(paths: string[]): Promise<string> {
  const key = paths.join("|");
  if (!cache.has(key)) {
    const p = build(paths);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key)!;
}
