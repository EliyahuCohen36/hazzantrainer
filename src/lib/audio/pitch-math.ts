/**
 * Pure pitch helpers (no browser APIs, so they are easy to unit-test).
 *
 * Everything musical happens in *semitones* (MIDI note numbers), not Hz.
 * A semitone is the same size at any register, so a child an octave
 * above the Hazzan produces the same intervals.
 */

export type MaybeNumber = number | null;

/** Hz → MIDI note number (A4 = 440 Hz = 69). Fractional values keep cents. */
export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Fold a semitone difference into [-6, +6).
 * 12 semitones (an octave) counts as 0, so a student singing an octave above
 * or below the master scores as a match.
 */
export function foldOctave(diff: number): number {
  return ((((diff + 6) % 12) + 12) % 12) - 6;
}

/** Root-mean-square loudness of one audio frame (0..1). */
export function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

/**
 * Fix octave errors from the detector. If the pitch jumps by more than ~9
 * semitones between two neighbouring frames (~16–40 ms apart), it is almost
 * certainly a detector octave slip, not singing, so pull it back by whole octaves.
 */
export function fixOctaveJumps(seq: MaybeNumber[]): MaybeNumber[] {
  let prev: number | null = null;
  return seq.map((v) => {
    if (v === null) return null;
    let out = v;
    if (prev !== null && Math.abs(out - prev) > 9) {
      out -= 12 * Math.round((out - prev) / 12);
    }
    prev = out;
    return out;
  });
}

/** Median filter over voiced frames only; removes single-frame glitches. */
export function medianFilter(seq: MaybeNumber[], radius = 2): MaybeNumber[] {
  return seq.map((v, i) => {
    if (v === null) return null;
    const win: number[] = [];
    for (let j = Math.max(0, i - radius); j <= Math.min(seq.length - 1, i + radius); j++) {
      const w = seq[j];
      if (w !== null) win.push(w);
    }
    return median(win);
  });
}

/**
 * Score one aligned point by how far it is from the master (semitones).
 *   ≤ 0.5 st → 1.0 (in tune; up to a quarter-tone off)
 *   ≥ 2.0 st → 0.0 (a whole step off = a wrong note)
 *   between   → linear
 * Tune these two numbers to make grading stricter or more lenient.
 */
export function pointScore(errSemitones: number): number {
  const e = Math.abs(errSemitones);
  if (e <= 0.5) return 1;
  if (e >= 2) return 0;
  return 1 - (e - 0.5) / 1.5;
}
