"use client";

/**
 * Checks a child's spoken word on the device itself (no internet service, works
 * in Safari on iPhone and iPad, Chrome, Edge, Android).
 *
 * The child's voice is compared with the Hazzan saying the word and with the
 * Hazzan saying the same letters with the wrong vowels (e.g. דָּבָר against
 * "deivar", "dovar"…) and a couple of other words. If the right word is the
 * closest match, the child read it right. Comparison: MFCC sound features,
 * normalised per recording, matched by dynamic time warping (so speed doesn't
 * matter), tried at a few voice-size settings so a child's higher voice can be
 * compared with a man's.
 */

import type { PracticeWord } from "@/data/beginner-words";
import { syllableRecordings } from "@/data/beginner-recordings";
import { audioContext, joinedWordSamples } from "./join-syllables";
import { shuffleArray } from "./shuffle";

const SR = 16000;
const N_FFT = 512;
const WIN = 400;
const HOP = 160;
const N_MELS = 26;
const N_CEP = 12;
const WARPS = [1.0, 1.1, 1.2, 1.3];
const VOWELS = ["qamats", "sere", "hireq", "holem", "qibbus"];
/** How much closer than every wrong answer the right word must be (1 = just closest; a little lenient for children). */
const LENIENCY = 1.02;

export const canRecord = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window !== "undefined" && "AudioContext" in window;

// ── Recording ──

export type Utterance = { samples: Float32Array; rate: number } | null;

/**
 * Records from the microphone until the child has spoken and stopped (or `maxMs`).
 * Returns null if nothing was said. `onVoice` is called when speech starts.
 */
export function recordWord(maxMs = 5000, onVoice?: () => void): { done: Promise<Utterance>; stop: () => void } {
  let stopNow = () => {};
  const done = (async (): Promise<Utterance> => {
    const ctx = audioContext();
    await ctx.resume();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
    });
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    const chunks: Float32Array[] = [];
    const rate = ctx.sampleRate;
    return await new Promise<Utterance>((resolve) => {
      let floor = 0;
      let n = 0;
      let started = -1;
      let quietSince = -1;
      let t = 0;
      const finish = (keep: boolean) => {
        proc.disconnect();
        src.disconnect();
        stream.getTracks().forEach((tr) => tr.stop());
        if (!keep || started < 0) return resolve(null);
        const all = new Float32Array(chunks.reduce((a, c) => a + c.length, 0));
        let o = 0;
        for (const c of chunks) {
          all.set(c, o);
          o += c.length;
        }
        resolve({ samples: all, rate });
      };
      stopNow = () => finish(true);
      proc.onaudioprocess = (e) => {
        const x = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(x));
        let s = 0;
        for (let i = 0; i < x.length; i++) s += x[i] * x[i];
        const rms = Math.sqrt(s / x.length);
        t += x.length / rate;
        if (n < 6) {
          floor = (floor * n + rms) / (n + 1); // background noise, first ~0.25 s
          n++;
          return;
        }
        const loud = rms > Math.max(floor * 3, 0.008);
        if (started < 0 && loud) {
          started = t;
          onVoice?.();
        }
        if (started >= 0) {
          if (loud) quietSince = -1;
          else if (quietSince < 0) quietSince = t;
          if (quietSince >= 0 && t - quietSince > 0.8) return finish(true);
        }
        if (t * 1000 > maxMs) finish(started >= 0);
      };
      src.connect(proc);
      proc.connect(ctx.destination);
    });
  })();
  return { done, stop: () => stopNow() };
}

// ── Sound features ──

function resample(x: Float32Array, rate: number): Float32Array {
  if (rate === SR) return x;
  const ratio = rate / SR;
  const k = Math.max(1, Math.round(ratio));
  const out = new Float32Array(Math.floor(x.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const c = Math.floor(i * ratio);
    let s = 0;
    let m = 0;
    for (let j = c - (k >> 1); j <= c + (k >> 1); j++) if (j >= 0 && j < x.length) (s += x[j]), m++;
    out[i] = s / m;
  }
  return out;
}

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const ar = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const ai = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - ar;
        im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar;
        im[i + k] += ai;
      }
  }
}

const HAMMING = Float64Array.from({ length: WIN }, (_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (WIN - 1)));

/** Power spectrum frames of a 16 kHz signal. */
function spectra(x: Float32Array): Float64Array[] {
  const frames: Float64Array[] = [];
  for (let start = 0; start + WIN <= x.length; start += HOP) {
    const re = new Float64Array(N_FFT);
    const im = new Float64Array(N_FFT);
    for (let i = 0; i < WIN; i++) re[i] = x[start + i] * HAMMING[i];
    fft(re, im);
    const p = new Float64Array(N_FFT / 2 + 1);
    for (let k = 0; k < p.length; k++) p[k] = re[k] * re[k] + im[k] * im[k];
    frames.push(p);
  }
  return frames;
}

const melCache = new Map<number, Float64Array[]>();
function melBank(warp: number): Float64Array[] {
  if (melCache.has(warp)) return melCache.get(warp)!;
  const mel = (f: number) => 2595 * Math.log10(1 + f / 700);
  const inv = (m: number) => 700 * (10 ** (m / 2595) - 1);
  const lo = mel(80 * warp);
  const hi = mel(Math.min(7600 * warp, SR / 2));
  const pts = Array.from({ length: N_MELS + 2 }, (_, i) => inv(lo + ((hi - lo) * i) / (N_MELS + 1)));
  const bins = N_FFT / 2 + 1;
  const bank = Array.from({ length: N_MELS }, (_, m) => {
    const f = new Float64Array(bins);
    for (let k = 0; k < bins; k++) {
      const hz = (k * SR) / N_FFT;
      if (hz > pts[m] && hz < pts[m + 2])
        f[k] = hz <= pts[m + 1] ? (hz - pts[m]) / (pts[m + 1] - pts[m]) : (pts[m + 2] - hz) / (pts[m + 2] - pts[m + 1]);
    }
    return f;
  });
  melCache.set(warp, bank);
  return bank;
}

/** MFCC features (12 per frame), loud frames only, normalised per recording. */
function features(spec: Float64Array[], warp: number): Float64Array[] {
  const bank = melBank(warp);
  const energy = spec.map((p) => Math.log(p.reduce((a, b) => a + b, 0) + 1e-8));
  const top = Math.max(...energy);
  const out: Float64Array[] = [];
  spec.forEach((p, t) => {
    if (energy[t] < top - 6) return;
    const logm = bank.map((f) => {
      let s = 0;
      for (let k = 0; k < f.length; k++) s += f[k] * p[k];
      return Math.log(s + 1e-8);
    });
    const c = new Float64Array(N_CEP);
    for (let n = 1; n <= N_CEP; n++) {
      let s = 0;
      for (let m = 0; m < N_MELS; m++) s += logm[m] * Math.cos((Math.PI * n * (m + 0.5)) / N_MELS);
      c[n - 1] = s;
    }
    out.push(c);
  });
  for (let d = 0; d < N_CEP; d++) {
    const mean = out.reduce((a, c) => a + c[d], 0) / (out.length || 1);
    const sd = Math.sqrt(out.reduce((a, c) => a + (c[d] - mean) ** 2, 0) / (out.length || 1)) + 1e-6;
    for (const c of out) c[d] = (c[d] - mean) / sd;
  }
  return out;
}

function dtw(a: Float64Array[], b: Float64Array[]): number {
  if (!a.length || !b.length) return Infinity;
  const m = b.length;
  let prev = new Float64Array(m + 1).fill(Infinity);
  prev[0] = 0;
  for (let i = 1; i <= a.length; i++) {
    const cur = new Float64Array(m + 1).fill(Infinity);
    for (let j = 1; j <= m; j++) {
      let d = 0;
      for (let k = 0; k < N_CEP; k++) d += (a[i - 1][k] - b[j - 1][k]) ** 2;
      cur[j] = Math.sqrt(d) + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    prev = cur;
  }
  return prev[m] / (a.length + b.length);
}

// ── Templates (the Hazzan) ──

const templateCache = new Map<string, Promise<Float64Array[] | null>>();
function template(syllables: string[]): Promise<Float64Array[] | null> {
  const key = syllables.join("|");
  if (!templateCache.has(key)) {
    const paths = syllableRecordings(syllables);
    templateCache.set(
      key,
      paths
        ? joinedWordSamples(paths)
            .then(({ samples, rate }) => features(spectra(resample(samples, rate)), 1))
            .catch(() => null)
        : Promise.resolve(null),
    );
  }
  return templateCache.get(key)!;
}

/** The right word, the same letters with wrong vowels, and two other words. */
export function candidates(word: PracticeWord, pool: PracticeWord[]): string[][] {
  const out: string[][] = [word.s];
  const seen = new Set([word.s.join("|")]);
  const add = (s: string[]) => {
    const k = s.join("|");
    if (!seen.has(k) && syllableRecordings(s)) {
      seen.add(k);
      out.push(s);
    }
  };
  // One vowel changed at a time (the usual reading mistake).
  const singles: string[][] = [];
  word.s.forEach((x, i) => {
    const [id, v] = x.split(":");
    if (!v) return;
    for (const w of VOWELS) if (w !== v) singles.push(word.s.map((y, j) => (j === i ? `${id}:${w}` : y)));
  });
  shuffleArray(singles).slice(0, 6).forEach(add);
  shuffleArray(pool.filter((w) => w.w !== word.w && w.s.length === word.s.length))
    .slice(0, 2)
    .forEach((w) => add(w.s));
  return out;
}

/** Is the recording the right word (the first candidate)? Null if it can't tell. */
export async function matchesWord(rec: NonNullable<Utterance>, cands: string[][]): Promise<boolean | null> {
  const temps = await Promise.all(cands.map(template));
  if (!temps[0]) return null;
  const spec = spectra(resample(rec.samples, rec.rate));
  const best = cands.map(() => Infinity);
  for (const w of WARPS) {
    const f = features(spec, w);
    if (f.length < 8) return null; // too short to be a word
    temps.forEach((t, i) => {
      if (t) best[i] = Math.min(best[i], dtw(f, t));
    });
  }
  const others = Math.min(...best.slice(1));
  return best[0] <= others * LENIENCY;
}

/** For tests only. */
export const _internals = { features, spectra, resample, dtw, WARPS, LENIENCY };
