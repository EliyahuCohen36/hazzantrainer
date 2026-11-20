import { LETTER_LESSONS, LEARN_PASS, learnKey } from "@/data/letter-lessons";

/**
 * Personal subscribers (and free testers) have no teacher: each level opens by itself when the
 * one before it is finished (owner, Nov 2026). School students' levels are opened by the teacher.
 */
const NEKUDA_GROUPS = ["a", "e", "i", "o", "u", "hataf"];
const PASS = 80;

export function selfPacedLevels(practice: Record<string, number>) {
  // Te'amim: Level n+1 opens when Level n is finished (TeamimLevels saves teamim-level:<n>).
  let level = 1;
  while ((practice[`teamim-level:${level}`] ?? 0) >= 100) level++;
  // Beginner Keriah: the whole alef-bet first (its lessons open one by one), then each group of
  // nekudot; after the last one, the chart, practice words and the reading rules (each of those
  // opens its own steps one after another).
  let beginner = 1;
  if (LETTER_LESSONS.every((l) => (practice[learnKey(l.id)] ?? 0) >= LEARN_PASS)) {
    beginner = 5;
    for (const g of NEKUDA_GROUPS) {
      // Passed with the level's pass mark (25 of 35), or 80% from before.
      if ((practice[`beginner-nekudot:${g}:passed`] ?? 0) >= 100 || (practice[`beginner-nekudot:${g}`] ?? 0) >= PASS) beginner++;
      else break;
    }
    if (beginner > 10) beginner = 99;
  }
  return { level, beginnerLevel: beginner, lettersOpen: 99 };
}
