import { ANALYSIS_RATE, analyzeSamples, decodeToMono16k, type AudioFeatures } from "./features";
import { fixOctaveJumps, hzToMidi, median, medianFilter, type MaybeNumber } from "./pitch-math";

/**
 * A pitch contour: the melody of a recording as a sequence of frames.
 *
 * `relative` is the key idea for octave-independent matching: every voiced
 * frame minus the recording's own median pitch. A Hazzan at 130 Hz and a
 * child at 330 Hz singing the same te'amim produce nearly the same
 * `relative` curve.
 */
export interface PitchContour {
  /** Seconds between frames. */
  hopSec: number;
  duration: number;
  /** Absolute pitch per frame (MIDI), null when unvoiced. */
  midi: MaybeNumber[];
  /** Pitch relative to `center`, in semitones. */
  relative: MaybeNumber[];
  /** Median MIDI pitch of the voiced frames (the singer's "home" pitch). */
  center: number;
  /** Seconds of voiced (sung) audio. */
  voicedSec: number;
}

/** Build a contour from raw per-frame Hz values. Used for master and student. */
export function contourFromHz(hz: MaybeNumber[], hopSec: number): PitchContour {
  const rawMidi = hz.map((f) => (f === null ? null : hzToMidi(f)));
  const midi = medianFilter(fixOctaveJumps(rawMidi), 2);
  const voiced = midi.filter((v): v is number => v !== null);
  const center = median(voiced);
  return {
    hopSec,
    duration: hz.length * hopSec,
    midi,
    relative: midi.map((v) => (v === null ? null : v - center)),
    center,
    voicedSec: voiced.length * hopSec,
  };
}

/**
 * Decode an audio file (MP3/WAV/M4A/OGG, or a MediaRecorder blob) and analyse it:
 * the pitch contour for melody scoring plus the frame features used for
 * pauses, clarity and note placement. Runs in the browser and yields to the
 * UI every 200 frames so the page stays responsive.
 */
export async function analyzeRecording(
  data: ArrayBuffer,
  onProgress?: (fraction: number) => void,
): Promise<AnalyzedRecording> {
  const samples = await decodeToMono16k(data);
  const features = await analyzeSamples(samples, ANALYSIS_RATE, {
    onProgress,
    yieldEvery: () => new Promise((r) => setTimeout(r, 0)),
  });
  return { contour: contourFromHz(features.hz, features.hopSec), features };
}

export interface AnalyzedRecording {
  contour: PitchContour;
  features: AudioFeatures;
}

/** Pitch contour only (kept for callers that need nothing else). */
export async function extractContour(
  data: ArrayBuffer,
  onProgress?: (fraction: number) => void,
): Promise<PitchContour> {
  return (await analyzeRecording(data, onProgress)).contour;
}
