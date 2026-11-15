import data from "./beginner-words.json";

/**
 * Practice words for Beginner Keriah: real words from the Torah that use only
 * the nekudot learned so far (no sheva). Built by scripts/beginner-words/build.py.
 *   w: the word (with nekudot)
 *   s: its syllables, to sound it out from the Hazzan's recordings:
 *      "bet:qamats" = Bet with an "a" sound, "resh" = Resh alone (no nekuda)
 */
export interface PracticeWord {
  w: string;
  s: string[];
}

const BY_LEVEL = data as Record<string, PracticeWord[]>;

/** The nekuda levels that have practice words (5 = Qamats & Patah … 10 = Hataf). */
export const WORD_LEVELS = Object.keys(BY_LEVEL).map(Number).sort((a, b) => a - b);
export const FIRST_WORD_LEVEL = WORD_LEVELS[0];
export const LAST_WORD_LEVEL = WORD_LEVELS[WORD_LEVELS.length - 1];

/** Words whose newest nekuda is taught in this level. */
export function newWords(level: number): PracticeWord[] {
  return BY_LEVEL[String(level)] ?? [];
}

/** Words that use only nekudot up to this level (the new ones and all earlier ones). */
export function wordsUpTo(level: number): PracticeWord[] {
  return WORD_LEVELS.filter((l) => l <= level).flatMap((l) => BY_LEVEL[String(l)]);
}
