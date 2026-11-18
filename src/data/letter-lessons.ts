import { LETTERS, SOFIYOT } from "./beginner";

/**
 * The alef-bet, one lesson at a time (owner, Nov 2026): each letter (and each final letter,
 * right after its regular letter) is learned, drawn and practised before the next one opens.
 * Look-alike letters get their own lesson as soon as the second of the pair is learned:
 * Vav / Zayin, Bet / Kaf, Khaf Sofit / Dalet, Gimel / Nun.
 */
export interface LetterLesson {
  id: string;
  kind: "letter" | "pair" | "script";
  /** The letter (or final letter) taught. */
  letter?: string;
  /** The two look-alike letters compared. */
  pair?: [string, string];
  /** What tells them apart. */
  tip?: string;
  /** The regular letter whose opening (by the teacher) opens this lesson. */
  gate: string;
}

export interface LessonGlyph {
  id: string;
  char: string;
  name: string;
  he: string;
  sound?: string;
}

export const GLYPHS: Map<string, LessonGlyph> = new Map([
  ...LETTERS.map((l) => [l.id, { id: l.id, char: l.char, name: l.name, he: l.he, sound: l.sound }] as const),
  ...SOFIYOT.map((s) => [s.id, { id: s.id, char: s.char, name: s.name, he: s.he }] as const),
]);

const PAIRS: Record<string, { pair: [string, string]; tip: string }> = {
  zayin: {
    pair: ["vav", "zayin"],
    tip: "Vav (ו) has a little head that bends to one side only. Zayin (ז) wears a flat hat that sticks out on BOTH sides.",
  },
  kaf: {
    pair: ["bet", "kaf"],
    tip: "Bet (בּ) has square corners and its bottom line sticks out at the end, like a heel. Kaf (כּ) is round, with no heel.",
  },
  "khaf-sofit": {
    pair: ["dalet", "khaf-sofit"],
    tip: "Dalet (ד) stands on the line and its roof sticks out past its leg. Khaf Sofit (ך) has a long leg that goes down BELOW the line, and a round corner.",
  },
  nun: {
    pair: ["gimel", "nun"],
    tip: "Gimel (ג) has a little foot that steps out at the bottom. Nun (נ) sits on a flat line along the bottom.",
  },
};

const ORDER = [
  "alef", "bet", "vet", "gimel", "dalet", "he", "vav", "zayin", "het", "tet", "yod", "kaf", "khaf", "khaf-sofit",
  "lamed", "mem", "mem-sofit", "nun", "nun-sofit", "samekh", "ayin", "pe", "fe", "fe-sofit", "tsadi", "tsadi-sofit",
  "qof", "resh", "shin", "sin", "tav",
];

const baseOf = (id: string) => SOFIYOT.find((s) => s.id === id)?.of ?? id;

export const LETTER_LESSONS: LetterLesson[] = ORDER.flatMap((id) => {
  const out: LetterLesson[] = [{ id, kind: "letter", letter: id, gate: baseOf(id) }];
  const p = PAIRS[id];
  if (p) out.push({ id: `pair-${p.pair.join("-")}`, kind: "pair", pair: p.pair, tip: p.tip, gate: baseOf(id) });
  return out;
});

/** Script (handwriting) letters: school students only, after the whole alef-bet; the teacher opens it. */
export const SCRIPT_LESSON: LetterLesson = { id: "script", kind: "script", gate: "tav" };

export const learnKey = (id: string) => `beginner-learn:${id}`;
export const LEARN_PASS = 80;
