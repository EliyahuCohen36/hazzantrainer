/**
 * Every number that decides how strict the trainer is, in one place.
 * Change these to make grading stricter or more lenient.
 */
export const SCORING = {
  /** How much each part counts in the final score (they are re-balanced if a part can't be measured). */
  weights: {
    melody: 0.4, // the right notes (pitch shape)
    placement: 0.3, // each note on the right syllable
    clarity: 0.3, // clear, steady, audible voice and words
    /**
     * Pauses at each mafsik. 0 = reminders only: the student is told when they
     * didn't pause, but it doesn't change the score. Set to e.g. 0.15 to count them.
     */
    pauses: 0,
  },

  pauses: {
    /** A frame counts as "pause" when it's this many dB quieter than the reader's normal loudness. */
    quietDb: 18,
    /** How far around the expected word boundary (seconds) to look for the pause. */
    searchSec: 0.2,
    /**
     * After a mesharet (connecting ta'am, like Ma'arikh or Shofar Holekh) the
     * words should flow together. A break longer than this (ms) loses points.
     */
    maxConnectedGapMs: 300,
  },

  placement: {
    /**
     * The note may be off by this fraction of a syllable and still get full
     * marks; at `zeroAt` syllables off it gets none.
     */
    fullAt: 0.35,
    zeroAt: 1.0,
    /** Shortest syllable length assumed (seconds), so fast readers aren't judged too harshly. */
    minSyllableSec: 0.12,
  },

  clarity: {
    weights: { voicing: 0.3, steadiness: 0.2, loudness: 0.2, articulation: 0.3 },
    /** Signal-to-noise (dB): full marks at or above `full`, none at or below `zero`. */
    loudness: { zero: 12, full: 25 },
  },
} as const;
