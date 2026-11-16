import { decodeAudio } from "./decode";
import { createPitchDetector } from "./pitch-detector";
import type { MaybeNumber } from "./pitch-math";

/**
 * Frame-by-frame features of a recording, used by the full reading score.
 * Pure TypeScript (no browser APIs), so it runs in tests too.
 *
 * Every array has one entry per frame, HOP samples apart (16 ms at 16 kHz),
 * the same frames the pitch contour uses.
 *
 *  - hz:   fundamental frequency, null when not sung (melody)
 *  - db:   loudness in dB (pauses, clarity)
 *  - mfcc: 12 cepstral coefficients, a fingerprint of *what is being said*
 *          (which vowel or consonant) that ignores the pitch. Comparing these
 *          tells us where the student says each syllable, separately from
 *          where they sing each note.
 */
export interface AudioFeatures {
  sampleRate: number;
  hopSec: number;
  hz: MaybeNumber[];
  db: number[];
  mfcc: Float32Array[];
}

export const ANALYSIS_RATE = 16000;
export const PITCH_WINDOW = 1024; // 64 ms → detects down to ~40 Hz
export const HOP = 256; // 16 ms
const SPEC_WINDOW = 512; // 32 ms, standard for speech sounds
const N_MELS = 26;
const N_MFCC = 12; // c1..c12 (c0 = loudness is left out)

/** In-place iterative radix-2 FFT. `re` and `im` must have a power-of-two length. */
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
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

const melOf = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const hzOfMel = (mel: number) => 700 * (10 ** (mel / 2595) - 1);

/** Triangular mel filters over the FFT bins. */
function melFilterbank(sampleRate: number, nfft: number, nMels: number, fMin = 80, fMax = 7600): Float64Array[] {
  const bins = nfft / 2 + 1;
  const lo = melOf(fMin);
  const hi = melOf(Math.min(fMax, sampleRate / 2));
  const points = Array.from({ length: nMels + 2 }, (_, i) => hzOfMel(lo + ((hi - lo) * i) / (nMels + 1)));
  const binOf = (hz: number) => (hz * nfft) / sampleRate;
  return Array.from({ length: nMels }, (_, m) => {
    const f = new Float64Array(bins);
    const [l, c, r] = [binOf(points[m]), binOf(points[m + 1]), binOf(points[m + 2])];
    for (let k = 0; k < bins; k++) {
      if (k > l && k < c) f[k] = (k - l) / (c - l);
      else if (k >= c && k < r) f[k] = (r - k) / (r - c);
    }
    return f;
  });
}

export interface AnalyzeOptions {
  onProgress?: (fraction: number) => void;
  /** Called every few hundred frames; return a promise to yield to the UI. */
  yieldEvery?: () => Promise<void> | void;
}

/** Analyse mono samples (ideally 16 kHz). */
export async function analyzeSamples(
  samples: Float32Array,
  sampleRate = ANALYSIS_RATE,
  { onProgress, yieldEvery }: AnalyzeOptions = {},
): Promise<AudioFeatures> {
  samples = normalizePeak(samples);
  const detect = createPitchDetector({ sampleRate });
  const filters = melFilterbank(sampleRate, SPEC_WINDOW, N_MELS);
  const hann = Float64Array.from({ length: SPEC_WINDOW }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / SPEC_WINDOW));
  const re = new Float64Array(SPEC_WINDOW);
  const im = new Float64Array(SPEC_WINDOW);
  const mel = new Float64Array(N_MELS);
  const bins = SPEC_WINDOW / 2 + 1;
  const power = new Float64Array(bins);

  const hz: MaybeNumber[] = [];
  const db: number[] = [];
  const mfcc: Float32Array[] = [];
  const total = Math.max(1, Math.floor((samples.length - PITCH_WINDOW) / HOP) + 1);
  const specOffset = (PITCH_WINDOW - SPEC_WINDOW) / 2; // centre both windows on the same instant

  for (let f = 0, i = 0; i + PITCH_WINDOW <= samples.length; f++, i += HOP) {
    hz.push(detect(samples.subarray(i, i + PITCH_WINDOW)));

    let energy = 0;
    for (let k = 0; k < SPEC_WINDOW; k++) {
      const x = samples[i + specOffset + k];
      energy += x * x;
      re[k] = x * hann[k];
      im[k] = 0;
    }
    db.push(10 * Math.log10(energy / SPEC_WINDOW + 1e-10));

    fft(re, im);
    for (let k = 0; k < bins; k++) power[k] = re[k] * re[k] + im[k] * im[k];
    for (let m = 0; m < N_MELS; m++) {
      let s = 0;
      const filt = filters[m];
      for (let k = 0; k < bins; k++) s += filt[k] * power[k];
      mel[m] = Math.log(s + 1e-10);
    }
    const c = new Float32Array(N_MFCC);
    for (let q = 1; q <= N_MFCC; q++) {
      let s = 0;
      for (let m = 0; m < N_MELS; m++) s += mel[m] * Math.cos((Math.PI * q * (m + 0.5)) / N_MELS);
      c[q - 1] = s;
    }
    mfcc.push(c);

    if (f % 200 === 0) {
      onProgress?.(f / total);
      await yieldEvery?.();
    }
  }
  onProgress?.(1);
  return { sampleRate, hopSec: HOP / sampleRate, hz, db, mfcc };
}

/**
 * Scale a recording so its loud parts peak near 0.5. A quiet microphone then
 * still gets its pitch detected; loudness is judged separately, as the gap
 * between the voice and the background noise (clarity score).
 */
export function normalizePeak(samples: Float32Array, target = 0.5): Float32Array {
  const step = Math.max(1, Math.floor(samples.length / 20000));
  const mags: number[] = [];
  for (let i = 0; i < samples.length; i += step) mags.push(Math.abs(samples[i]));
  mags.sort((a, b) => a - b);
  const peak = mags[Math.floor(mags.length * 0.999)] ?? 0;
  if (peak < 1e-5) return samples;
  const gain = Math.min(50, target / peak);
  return samples.map((x) => x * gain);
}

/** Browser only: decode any audio file to mono 16 kHz samples. */
export async function decodeToMono16k(data: ArrayBuffer): Promise<Float32Array> {
  const Offline = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const decoder = new Offline(1, 1, 44100);
  const decoded = await decodeAudio(decoder, data.slice(0));
  const length = Math.max(1, Math.ceil(decoded.duration * ANALYSIS_RATE));
  const offline = new Offline(1, length, ANALYSIS_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  return (await offline.startRendering()).getChannelData(0);
}
