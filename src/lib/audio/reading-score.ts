import type { SegmentTiming, TextSegment } from "@/types/curriculum";
import { getTaam, type TaamInfo } from "@/lib/hebrew/teamim";
import { countSyllables } from "@/lib/hebrew/syllables";
import { compareContours, type ComparisonResult } from "./compare";
import type { PitchContour } from "./contour";
import type { AudioFeatures } from "./features";
import { median } from "./pitch-math";
import { SCORING } from "./scoring-config";

/**
 * The full reading score: melody, note placement, pauses and clarity.
 *
 * Two independent alignments of the student against the master:
 *
 *   melodic  (compare.ts)     where the student sang each master *note*
 *   phonetic (this file)      where the student said each master *syllable*
 *
 * When the ta'am is sung on the right syllable, both agree. If the student
 * sings the melody one syllable early or late, they disagree inside that word
 * by about a syllable, and the placement score drops. The phonetic alignment
 * also tells us where each word starts and ends in the student's recording,
 * which is where we look for pauses.
 */

export interface RecordingAnalysis {
  contour: PitchContour;
  features: AudioFeatures;
}

export interface PauseCheck {
  /** "stop" after a mafsik, "connect" after a mesharet. */
  kind: "stop" | "connect";
  requiredMs: number;
  /** Longest near-silence the student left at this word boundary. */
  actualMs: number;
  /** Same measurement in the master recording, for reference. */
  masterMs: number;
  score: number;
  ok: boolean;
}

export interface PlacementCheck {
  score: number;
  /** How far apart the note and the syllable were, in syllables. Positive = note came late. */
  shiftSyllables: number;
  ok: boolean;
}

export interface WordReport {
  segmentId: string;
  text: string;
  taam?: TaamInfo;
  melody?: number;
  placement?: PlacementCheck;
  pause?: PauseCheck;
  /** This word's combined score (melody, placement and pause), for colouring the text. */
  score?: number;
  /** Where the word was found in the student's recording (seconds). */
  studentStart?: number;
  studentEnd?: number;
}

export interface ClarityReport {
  score: number;
  /** Voice stays sung (not breathy or whispered). */
  voicing: number;
  /** Notes are held steadily (no wobble). */
  steadiness: number;
  /** Loud enough above the background noise. */
  loudness: number;
  /** Consonants and syllables are pronounced distinctly (not mumbled). */
  articulation: number;
}

export interface ReadingResult {
  overall: number;
  subscores: { melody: number; placement: number | null; pauses: number | null; clarity: number };
  melody: ComparisonResult;
  clarity: ClarityReport;
  words: WordReport[];
  tips: string[];
  /** Combined per-word scores keyed by segment id, for the reading pane. */
  segmentScores: Record<string, number>;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const pct = (x: number) => Math.round(100 * clamp01(x));

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}

/** Loudness landmarks of a recording. */
function levels(db: number[]) {
  const speech = percentile(db, 90);
  const floor = percentile(db, 5);
  const isSpeech = (v: number) => v > speech - 25;
  let first = db.findIndex(isSpeech);
  let last = db.length - 1 - [...db].reverse().findIndex(isSpeech);
  if (first < 0) {
    first = 0;
    last = db.length - 1;
  }
  return { speech, floor, first, last };
}

/* ------------------------------------------------------------------ */
/* Phonetic alignment                                                  */
/* ------------------------------------------------------------------ */

const MAX_POINTS = 450;

/** MFCCs normalised per recording (removes microphone and voice colour), plus a silence feature. */
function phoneticVectors(f: AudioFeatures, from: number, to: number, speechDb: number): Float32Array[] {
  const dims = f.mfcc[0]?.length ?? 0;
  const mean = new Float64Array(dims);
  const sq = new Float64Array(dims);
  let n = 0;
  for (let i = from; i <= to; i++) {
    if (f.db[i] < speechDb - 25) continue;
    n++;
    for (let d = 0; d < dims; d++) {
      mean[d] += f.mfcc[i][d];
      sq[d] += f.mfcc[i][d] ** 2;
    }
  }
  n = Math.max(1, n);
  const sd = new Float64Array(dims);
  for (let d = 0; d < dims; d++) {
    mean[d] /= n;
    sd[d] = Math.sqrt(Math.max(1e-6, sq[d] / n - mean[d] ** 2));
  }
  const out: Float32Array[] = [];
  for (let i = from; i <= to; i++) {
    const v = new Float32Array(dims + 1);
    for (let d = 0; d < dims; d++) v[d] = (f.mfcc[i][d] - mean[d]) / sd[d];
    // Silence vs sound, so pauses line up with pauses.
    v[dims] = 1.5 * Math.max(-3, Math.min(0, (f.db[i] - speechDb) / 10));
    out.push(v);
  }
  return out;
}

function dist(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s / a.length);
}

/** Average consecutive frames so DTW stays fast. Returns the averaged vectors and each one's centre frame offset. */
function decimateVectors(v: Float32Array[]): { vecs: Float32Array[]; centers: number[] } {
  const stride = Math.max(1, Math.ceil(v.length / MAX_POINTS));
  const vecs: Float32Array[] = [];
  const centers: number[] = [];
  for (let i = 0; i < v.length; i += stride) {
    const chunk = v.slice(i, i + stride);
    const avg = new Float32Array(chunk[0].length);
    for (const c of chunk) for (let d = 0; d < avg.length; d++) avg[d] += c[d] / chunk.length;
    vecs.push(avg);
    centers.push(i + (chunk.length - 1) / 2);
  }
  return { vecs, centers };
}

function dtwPath(a: Float32Array[], b: Float32Array[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const W = m + 1;
  const D = new Float64Array((n + 1) * W).fill(Infinity);
  D[0] = 0;
  const band = Math.max(0.25, Math.abs(n - m) / Math.max(n, m) + 0.1) + 2 / Math.max(n, m);
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (Math.abs(i / n - j / m) > band) continue;
      const c = dist(a[i - 1], b[j - 1]);
      D[i * W + j] = c + Math.min(D[(i - 1) * W + j - 1], D[(i - 1) * W + j], D[i * W + j - 1]);
    }
  }
  const path: Array<[number, number]> = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    path.push([i - 1, j - 1]);
    const diag = D[(i - 1) * W + j - 1];
    const up = D[(i - 1) * W + j];
    const left = D[i * W + j - 1];
    if (diag <= up && diag <= left) {
      i--;
      j--;
    } else if (up < left) i--;
    else j--;
  }
  return path.reverse();
}

/**
 * Turn an alignment path into a lookup: master frame → student frame
 * (fractional), filling gaps by linear interpolation.
 */
function frameMap(pairs: Array<[number, number]>, masterLength: number): Float64Array {
  const sum = new Float64Array(masterLength);
  const cnt = new Float64Array(masterLength);
  for (const [mf, sf] of pairs) {
    const k = Math.round(mf);
    if (k < 0 || k >= masterLength) continue;
    sum[k] += sf;
    cnt[k]++;
  }
  const out = new Float64Array(masterLength).fill(NaN);
  for (let k = 0; k < masterLength; k++) if (cnt[k]) out[k] = sum[k] / cnt[k];
  // Interpolate inside, hold at the ends.
  let prev = -1;
  for (let k = 0; k < masterLength; k++) {
    if (Number.isNaN(out[k])) continue;
    if (prev >= 0 && k - prev > 1) {
      for (let q = prev + 1; q < k; q++) out[q] = out[prev] + ((out[k] - out[prev]) * (q - prev)) / (k - prev);
    }
    prev = k;
  }
  const firstK = out.findIndex((v) => !Number.isNaN(v));
  if (firstK < 0) return out;
  for (let k = 0; k < firstK; k++) out[k] = out[firstK];
  for (let k = prev + 1; k < masterLength; k++) out[k] = out[prev];
  return out;
}

export function phoneticAlign(master: AudioFeatures, student: AudioFeatures): Float64Array {
  const lm = levels(master.db);
  const ls = levels(student.db);
  const mv = decimateVectors(phoneticVectors(master, lm.first, lm.last, lm.speech));
  const sv = decimateVectors(phoneticVectors(student, ls.first, ls.last, ls.speech));
  const path = dtwPath(mv.vecs, sv.vecs);
  const pairs = path.map(([i, j]) => [lm.first + mv.centers[i], ls.first + sv.centers[j]] as [number, number]);
  return frameMap(pairs, master.db.length);
}

/* ------------------------------------------------------------------ */
/* Pauses                                                              */
/* ------------------------------------------------------------------ */

/** Longest run of quiet frames between two frame indices, in ms. */
function longestQuietMs(f: AudioFeatures, from: number, to: number, speechDb: number): number {
  const limit = speechDb - SCORING.pauses.quietDb;
  let best = 0;
  let run = 0;
  for (let i = Math.max(0, Math.floor(from)); i <= Math.min(f.db.length - 1, Math.ceil(to)); i++) {
    if (f.db[i] < limit) best = Math.max(best, ++run);
    else run = 0;
  }
  return best * f.hopSec * 1000;
}

/* ------------------------------------------------------------------ */
/* Clarity                                                             */
/* ------------------------------------------------------------------ */

function clarityStats(rec: RecordingAnalysis) {
  const f = rec.features;
  const lv = levels(f.db);
  let speechFrames = 0;
  let voicedFrames = 0;
  for (let i = lv.first; i <= lv.last; i++) {
    if (f.db[i] < lv.speech - 25) continue;
    speechFrames++;
    if (f.hz[i] !== null) voicedFrames++;
  }
  // Note steadiness: typical frame-to-frame pitch change while singing.
  const steps: number[] = [];
  const midi = rec.contour.midi;
  for (let i = 1; i < midi.length; i++) {
    const a = midi[i - 1];
    const b = midi[i];
    if (a !== null && b !== null) steps.push(Math.abs(b - a));
  }
  // Articulation: how much loudness moves syllable to syllable (consonant
  // dips between vowels). Mumbling flattens this.
  const d = f.db.map((v) => Math.max(v, lv.speech - 40));
  const R = 7; // ±7 frames ≈ 230 ms moving average
  let modSq = 0;
  let modN = 0;
  for (let i = lv.first; i <= lv.last; i++) {
    let s = 0;
    let c = 0;
    for (let k = Math.max(lv.first, i - R); k <= Math.min(lv.last, i + R); k++) {
      s += d[k];
      c++;
    }
    modSq += (d[i] - s / c) ** 2;
    modN++;
  }
  return {
    voicedRatio: speechFrames ? voicedFrames / speechFrames : 0,
    jitter: steps.length ? median(steps) : 0,
    snr: lv.speech - lv.floor,
    modulation: Math.sqrt(modSq / Math.max(1, modN)),
  };
}

function scoreClarity(master: RecordingAnalysis, student: RecordingAnalysis): ClarityReport {
  const m = clarityStats(master);
  const s = clarityStats(student);
  const cfg = SCORING.clarity;
  const voicing = clamp01((s.voicedRatio / Math.max(0.05, m.voicedRatio) - 0.6) / 0.35);
  const steadiness = clamp01(1 - (s.jitter / Math.max(0.02, m.jitter) - 1.3) / 1.5);
  const loudness = clamp01((s.snr - cfg.loudness.zero) / (cfg.loudness.full - cfg.loudness.zero));
  const articulation = clamp01((s.modulation / Math.max(0.5, m.modulation) - 0.4) / 0.5);
  const w = cfg.weights;
  const score = w.voicing * voicing + w.steadiness * steadiness + w.loudness * loudness + w.articulation * articulation;
  return { score: pct(score), voicing: pct(voicing), steadiness: pct(steadiness), loudness: pct(loudness), articulation: pct(articulation) };
}

/* ------------------------------------------------------------------ */
/* Everything together                                                 */
/* ------------------------------------------------------------------ */

export function scoreReading(
  master: RecordingAnalysis,
  student: RecordingAnalysis,
  segments: TextSegment[],
  timings: SegmentTiming[],
): ReadingResult {
  const hop = master.features.hopSec;
  const melody = compareContours(master.contour, student.contour, timings);
  const clarity = scoreClarity(master, student);

  const phon = phoneticAlign(master.features, student.features);
  const mel = melody.melodyPath.length ? frameMap(melody.melodyPath, master.features.db.length) : null;
  const toStudentSec = (masterSec: number) => {
    const k = Math.max(0, Math.min(phon.length - 1, Math.round(masterSec / hop)));
    return phon[k] * hop;
  };

  const mLv = levels(master.features.db);
  const sLv = levels(student.features.db);
  const timingOf = new Map(timings.map((t) => [t.segmentId, t]));
  const P = SCORING.pauses;
  const PL = SCORING.placement;

  const words: WordReport[] = segments.map((seg, i) => {
    const taam = getTaam(seg.taam);
    const t = timingOf.get(seg.id);
    const report: WordReport = { segmentId: seg.id, text: seg.text, taam, melody: melody.segmentScores[seg.id] };
    if (!t) return report;
    report.studentStart = toStudentSec(t.start);
    report.studentEnd = toStudentSec(t.end);

    // Note placement: compare where the stressed syllable was *said* with where its melody was *sung*.
    if (mel && t.stressStart !== undefined && t.stressEnd !== undefined) {
      const shifts: number[] = [];
      for (let k = Math.ceil(t.stressStart / hop); k <= Math.floor(t.stressEnd / hop); k++) {
        if (master.contour.midi[k] === null || k >= mel.length) continue;
        shifts.push((mel[k] - phon[k]) * hop);
      }
      if (shifts.length >= 3) {
        const syllables = seg.syllables ?? countSyllables(seg.text);
        const wordSec = Math.max(0.05, report.studentEnd - report.studentStart);
        const sylSec = Math.max(PL.minSyllableSec, wordSec / syllables);
        const shift = median(shifts) / sylSec;
        const score = clamp01(1 - (Math.abs(shift) - PL.fullAt) / (PL.zeroAt - PL.fullAt));
        report.placement = { score: pct(score), shiftSyllables: Math.round(shift * 10) / 10, ok: score >= 0.7 };
      }
    }

    // Pauses: stop after a mafsik, keep going after a mesharet. Not checked after the last word.
    const next = segments[i + 1] && timingOf.get(segments[i + 1].id);
    if (taam && next) {
      const a = Math.min(report.studentEnd, toStudentSec(next.start)) - P.searchSec;
      const b = Math.max(report.studentEnd, toStudentSec(next.start)) + P.searchSec;
      const actualMs = longestQuietMs(student.features, a / hop, b / hop, sLv.speech);
      const masterMs = longestQuietMs(
        master.features,
        (Math.min(t.end, next.start) - 0.1) / hop,
        (Math.max(t.end, next.start) + 0.1) / hop,
        mLv.speech,
      );
      if (taam.role === "disjunctive" && taam.pauseMs > 0) {
        const score = clamp01(actualMs / taam.pauseMs);
        report.pause = { kind: "stop", requiredMs: taam.pauseMs, actualMs: Math.round(actualMs), masterMs: Math.round(masterMs), score: pct(score), ok: score >= 0.9 };
      } else if (taam.role === "conjunctive") {
        const over = actualMs > P.maxConnectedGapMs;
        report.pause = { kind: "connect", requiredMs: P.maxConnectedGapMs, actualMs: Math.round(actualMs), masterMs: Math.round(masterMs), score: over ? 0 : 100, ok: !over };
      }
    }
    return report;
  });

  for (const w of words) {
    const parts = [w.melody, w.placement?.score, w.pause?.score].filter((x): x is number => x !== undefined);
    if (parts.length) w.score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const placement = avg(words.flatMap((w) => (w.placement ? [w.placement.score] : [])));
  // Mafsik pauses count fully; a broken connection after a mesharet counts as one miss.
  const pauseScores = words.flatMap((w) => (w.pause && (w.pause.kind === "stop" || !w.pause.ok) ? [w.pause.score] : []));
  const pauses = avg(pauseScores);

  const W = SCORING.weights;
  const parts: Array<[number, number]> = [
    [W.melody, melody.score],
    [W.clarity, clarity.score],
  ];
  if (placement !== null) parts.push([W.placement, placement]);
  if (pauses !== null && W.pauses > 0) parts.push([W.pauses, pauses]);
  const totalW = parts.reduce((a, [w]) => a + w, 0);
  const overall = Math.round(parts.reduce((a, [w, s]) => a + w * s, 0) / totalW);

  return {
    overall,
    subscores: {
      melody: melody.score,
      placement: placement === null ? null : Math.round(placement),
      pauses: pauses === null ? null : Math.round(pauses),
      clarity: clarity.score,
    },
    melody,
    clarity,
    words,
    tips: buildTips(words, clarity, melody),
    segmentScores: Object.fromEntries(words.flatMap((w) => (w.score === undefined ? [] : [[w.segmentId, w.score]]))),
  };
}

function buildTips(words: WordReport[], clarity: ClarityReport, melody: ComparisonResult): string[] {
  const tips: string[] = [];
  const pauseTips: string[] = [];
  for (const w of words) {
    const name = w.taam?.syrian ?? "the ta'am";
    if (w.pause && !w.pause.ok) {
      pauseTips.push(
        w.pause.kind === "stop"
          ? `Remember to pause after ${plain(w.text)}: ${name} is a mafsik.`
          : `Try not to stop after ${plain(w.text)}: ${name} connects it to the next word.`,
      );
    }
    if (w.placement && !w.placement.ok) {
      tips.push(
        `In ${plain(w.text)}, sing the ${name} on the stressed syllable (the letter with the mark). Your melody came ${w.placement.shiftSyllables < 0 ? "too early" : "too late"}.`,
      );
    }
  }
  if (melody.coverage < 0.7) tips.push("Read the whole pasuk: part of it was missing.");
  if (clarity.loudness < 60) tips.push("Chant a little louder, or move closer to the microphone.");
  if (clarity.voicing < 60) tips.push("Use a full singing voice. Some of the words sounded whispered or breathy.");
  if (clarity.articulation < 60) tips.push("Pronounce every letter clearly; some syllables ran together.");
  if (clarity.steadiness < 60) tips.push("Hold each note steady, without wobbling.");
  // Pause reminders come after the scored tips, but always fit on the card.
  return [...tips.slice(0, Math.max(3, 6 - pauseTips.length)), ...pauseTips].slice(0, 7);
}

/** Hebrew word without nikkud or te'amim, for tips. */
function plain(text: string): string {
  return text.replace(/[֑-ׇ]/g, "");
}
