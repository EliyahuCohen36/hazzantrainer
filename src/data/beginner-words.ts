import data from "./beginner-words.json";

/**
 * Practice words for Beginner Keriah: real words from the Torah that use only
 * the nekudot learned so far (no sheva). Built by scripts/beginner-words/build.py.
 *   w: the word (with nekudot)
 *   s: its syllables, to sound it out from the Hazzan's recordings:
 *      "bet:qamats" = Bet with an "a" sound, "resh" = Resh alone (no nekuda)
 *   g: the sounds it uses, e.g. "ae" = a and e
 *   h: 1 if it has a hataf
 */
export interface PracticeWord {
  w: string;
  s: string[];
  g: string;
  h?: 1;
}

const WORDS = data as PracticeWord[];

/**
 * The word-practice stages, in order. Each is 50 questions; a child must pass
 * one (at least 40 of 50 right) before the next opens. First one sound alone,
 * then the next sound alone, then words mixing them, and so on.
 */
export interface WordStage {
  id: string;
  title: string;
  he: string;
  /** The Beginner Keriah level (teacher-opened) this stage needs. */
  level: number;
  words: PracticeWord[];
}

export const STAGE_QUESTIONS = 50;
export const STAGE_PASS = 40;

const only = (g: string) => WORDS.filter((w) => !w.h && w.g === g);
/** Words that mix the new sound with sounds learned before (no hataf). */
const mix = (newest: string, learned: string) =>
  WORDS.filter((w) => !w.h && w.g.length >= 2 && w.g.includes(newest) && [...w.g].every((c) => learned.includes(c)));

export const WORD_STAGES: WordStage[] = [
  { id: "a", title: "Words with \"a\" (Qamats, Patah)", he: "קָמַץ פַּתַח", level: 5, words: only("a") },
  { id: "e", title: "Words with \"e\" (Sere, Segol)", he: "צֵרֵי סֶגּוֹל", level: 6, words: only("e") },
  { id: "ae", title: "\"a\" and \"e\" together", he: "אָ אֶ", level: 6, words: mix("e", "ae") },
  { id: "i", title: "Words with \"i\" (Hireq)", he: "חִירֶק", level: 7, words: only("i") },
  { id: "aei", title: "\"i\" with \"a\" and \"e\"", he: "אָ אֶ אִ", level: 7, words: mix("i", "aei") },
  { id: "o", title: "Words with \"o\" (Holem)", he: "חוֹלֶם", level: 8, words: only("o") },
  { id: "aeio", title: "\"o\" with the sounds before", he: "אָ אֶ אִ אוֹ", level: 8, words: mix("o", "aeio") },
  { id: "u", title: "Words with \"u\" (Qibbus, Shuruq)", he: "קִבּוּץ שׁוּרֶק", level: 9, words: only("u") },
  { id: "aeiou", title: "\"u\" with the sounds before", he: "אָ אֶ אִ אוֹ אוּ", level: 9, words: mix("u", "aeiou") },
  { id: "hataf", title: "Words with a Hataf", he: "חֲטָפִים", level: 10, words: WORDS.filter((w) => w.h) },
  { id: "all", title: "All the nekudot together", he: "הַכֹּל", level: 11, words: WORDS },
];

export const FIRST_WORD_LEVEL = WORD_STAGES[0].level;
export const stageKey = (id: string) => `beginner-stage:${id}`;
/** Saying words aloud: right/total per step, and per word (for "words to practice"). */
export const sayKey = (stageId: string) => `beginner-say:${stageId}`;
export const sayWordKey = (word: string) => `beginner-word:${word}`;
