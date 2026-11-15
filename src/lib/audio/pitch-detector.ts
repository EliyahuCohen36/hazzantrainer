import { YIN } from "pitchfinder";
import { rms } from "./pitch-math";

export interface PitchDetectorOptions {
  sampleRate: number;
  /** Lowest pitch accepted (Hz). 60 Hz covers a deep adult voice. */
  minHz?: number;
  /** Highest pitch accepted (Hz). 1100 Hz covers a child's upper range. */
  maxHz?: number;
  /** Frames quieter than this RMS count as silence (unvoiced). */
  silenceRms?: number;
}

export type FrameDetector = (frame: Float32Array) => number | null;

/**
 * Wrap Pitchfinder's YIN detector with a silence gate and a range check.
 * Returns the fundamental frequency in Hz, or null if the frame is unvoiced.
 */
export function createPitchDetector({
  sampleRate,
  minHz = 60,
  maxHz = 1100,
  silenceRms = 0.01,
}: PitchDetectorOptions): FrameDetector {
  const yin = YIN({ sampleRate, threshold: 0.15 });
  return (frame) => {
    if (rms(frame) < silenceRms) return null;
    const hz = yin(frame);
    if (hz === null || !Number.isFinite(hz) || hz < minHz || hz > maxHz) return null;
    return hz;
  };
}
