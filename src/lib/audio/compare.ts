import type { SegmentTiming } from "@/types/curriculum";
import type { PitchContour } from "./contour";
import { foldOctave, pointScore, type MaybeNumber } from "./pitch-math";

export interface ComparisonResult {
  /** 0–100 overall accuracy. */
  score: number;
  /** Average distance from the master melody, in semitones. */
  meanErrorSemitones: number;
  /** How much of the master's sung length the student covered (0–1). */
  coverage: number;
  /**
   * The student's pitch mapped onto the master's timeline (same length as
   * master.relative), already octave-folded so it can be drawn over the master.
   */
  aligned: MaybeNumber[];
  /** Per-frame error on the master timeline, for colouring the graph. */
  alignedError: MaybeNumber[];
  /** Per-word scores (0–100), when the master has word timings. */
  segmentScores: Record<string, number>;
  /**
   * The melody alignment as [masterFrame, studentFrame] pairs (original frame
   * indices, voiced frames only, in order). Says where in the student's
   * recording each master note was sung.
   */
  melodyPath: Array<[number, number]>;
}

const MAX_POINTS = 400; // DTW is O(n·m); 400×400 = 160k cells, instant.
/**
 * Sakoe-Chiba band: the alignment may drift at most this fraction of the
 * pasuk away from the diagonal. Without it, DTW can "cherry-pick" a matching
 * frame for every master note out of a wrong melody.
 */
const BAND = 0.2;

interface VoicedSeq {
  values: number[];
  /** Original frame index for each value. */
  frames: number[];
}

function voiced(seq: MaybeNumber[]): VoicedSeq {
  const values: number[] = [];
  const frames: number[] = [];
  seq.forEach((v, i) => {
    if (v !== null) {
      values.push(v);
      frames.push(i);
    }
  });
  return { values, frames };
}

/** Keep every k-th point so long recordings stay fast. Returns groups of original indices. */
function decimate(seq: VoicedSeq): { values: number[]; groups: number[][] } {
  const stride = Math.max(1, Math.ceil(seq.values.length / MAX_POINTS));
  const values: number[] = [];
  const groups: number[][] = [];
  for (let i = 0; i < seq.values.length; i += stride) {
    const chunk = seq.values.slice(i, i + stride);
    values.push(chunk.reduce((a, b) => a + b, 0) / chunk.length);
    groups.push(seq.frames.slice(i, i + stride));
  }
  return { values, groups };
}

/**
 * Dynamic Time Warping between two relative-pitch sequences.
 * Lets the student be slower or faster than the master (and hold notes
 * longer) while still matching the melody shape note-for-note.
 * Cost = octave-folded semitone distance.
 */
function dtw(a: number[], b: number[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const D = new Float64Array((n + 1) * (m + 1)).fill(Infinity);
  const idx = (i: number, j: number) => i * (m + 1) + j;
  D[idx(0, 0)] = 0;
  const band = Math.max(BAND, Math.abs(n - m) / Math.max(n, m)) + 2 / Math.max(n, m);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (Math.abs(i / n - j / m) > band) continue;
      const cost = Math.abs(foldOctave(a[i - 1] - b[j - 1]));
      D[idx(i, j)] = cost + Math.min(D[idx(i - 1, j)], D[idx(i, j - 1)], D[idx(i - 1, j - 1)]);
    }
  }
  // Backtrack from the end to recover the alignment path.
  const path: Array<[number, number]> = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    path.push([i - 1, j - 1]);
    const diag = D[idx(i - 1, j - 1)];
    const up = D[idx(i - 1, j)];
    const left = D[idx(i, j - 1)];
    if (diag <= up && diag <= left) {
      i--;
      j--;
    } else if (up < left) i--;
    else j--;
  }
  return path.reverse();
}

/**
 * Compare a student's attempt against the master recording.
 * Both contours are already centred on their own median pitch, so the
 * comparison is about intervals (melody shape), not absolute key or octave.
 */
export function compareContours(
  master: PitchContour,
  student: PitchContour,
  timings: SegmentTiming[] = [],
): ComparisonResult {
  const empty: ComparisonResult = {
    score: 0,
    meanErrorSemitones: 0,
    coverage: 0,
    aligned: master.relative.map(() => null),
    alignedError: master.relative.map(() => null),
    segmentScores: {},
    melodyPath: [],
  };

  const mV = voiced(master.relative);
  const sV = voiced(student.relative);
  if (mV.values.length < 5 || sV.values.length < 10) return empty;

  const m = decimate(mV);
  const s = decimate(sV);
  const path = dtw(m.values, s.values);

  // For each master point keep the best-matching student point (did the
  // student sing every master note?), and for each student point its best
  // master match (did the student add wrong notes?).
  const bestErr = new Array<number>(m.values.length).fill(Infinity);
  const bestDisplay = new Array<number>(m.values.length).fill(0);
  const studentErr = new Array<number>(s.values.length).fill(Infinity);
  for (const [mi, si] of path) {
    const diff = foldOctave(s.values[si] - m.values[mi]);
    const e = Math.abs(diff);
    if (e < bestErr[mi]) {
      bestErr[mi] = e;
      bestDisplay[mi] = m.values[mi] + diff; // student drawn in the master's octave
    }
    if (e < studentErr[si]) studentErr[si] = e;
  }
  const studentSide = studentErr.reduce((a, e) => a + pointScore(e), 0) / s.values.length;

  const aligned: MaybeNumber[] = master.relative.map(() => null);
  const alignedError: MaybeNumber[] = master.relative.map(() => null);
  const frameScores: MaybeNumber[] = master.relative.map(() => null);
  let scoreSum = 0;
  let errSum = 0;
  m.groups.forEach((frames, k) => {
    const err = bestErr[k];
    scoreSum += pointScore(err);
    errSum += err;
    for (const f of frames) {
      aligned[f] = bestDisplay[k];
      alignedError[f] = err;
      frameScores[f] = pointScore(err);
    }
  });

  // Both directions count equally.
  const raw = (scoreSum / m.values.length + studentSide) / 2;
  const coverage = Math.min(1, student.voicedSec / Math.max(0.001, master.voicedSec));
  // Mumbling a fragment shouldn't score well: scale down below 50% coverage.
  const coverageFactor = coverage >= 0.5 ? 1 : coverage / 0.5;

  // Per-word scores from the master's word timings.
  const segmentScores: Record<string, number> = {};
  for (const t of timings) {
    const from = Math.floor(t.start / master.hopSec);
    const to = Math.min(frameScores.length, Math.ceil(t.end / master.hopSec));
    let sum = 0;
    let count = 0;
    for (let f = from; f < to; f++) {
      const v = frameScores[f];
      if (v !== null && v !== undefined) {
        sum += v;
        count++;
      }
    }
    if (count > 0) segmentScores[t.segmentId] = Math.round((100 * sum * coverageFactor) / count);
  }

  return {
    score: Math.round(100 * raw * coverageFactor),
    meanErrorSemitones: errSum / m.values.length,
    coverage,
    aligned,
    alignedError,
    segmentScores,
    melodyPath: path.map(([mi, si]) => [m.groups[mi][0], s.groups[si][0]] as [number, number]),
  };
}
