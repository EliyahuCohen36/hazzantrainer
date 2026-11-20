"use client";

import { useAuth } from "@/lib/auth";

/**
 * How many questions a Beginner Keriah lesson asks and how many must be right to finish it (owner, Nov 20 2026).
 * - The Nekudot practice: 35 questions, 25 right, for everyone.
 * - Other steps: school students 50 / 40, personal subscribers and everyone else 25 / 20.
 * - A teacher can change any of these for their class in /teacher/ (classes.questions, supabase/questions.sql).
 */
export type QArea = "letters" | "nekudot" | "words" | "sheva" | "katan" | "genuva" | "dagesh" | "he";
export interface QSetting {
  n: number;
  pass: number;
}

export const Q_AREAS: { id: QArea; title: string }[] = [
  { id: "letters", title: "The Alef-Bet (letter practice)" },
  { id: "nekudot", title: "The Nekudot (each practice level)" },
  { id: "words", title: "Practice words (each step)" },
  { id: "sheva", title: "The Sheva (each level)" },
  { id: "katan", title: "Qamats Katan (each level)" },
  { id: "genuva", title: "Patah Genuva (each level)" },
  { id: "dagesh", title: "Dagesh (each level)" },
  { id: "he", title: "The four kinds of He (each level)" },
];

export function defaultQuestions(area: QArea, student: boolean): QSetting | null {
  if (area === "letters") return null; // automatic: 5 per open letter
  if (area === "nekudot") return { n: 35, pass: 25 };
  return student ? { n: 50, pass: 40 } : { n: 25, pass: 20 };
}

/** The setting for this child: their teacher's, or the default. `null` = the lesson decides (letters). */
export function useQuestions(area: QArea): QSetting | null {
  const { profile, questions } = useAuth();
  const student = profile?.role === "student";
  const t = student ? questions?.[area] : undefined;
  if (t && t.n > 0) return { n: Math.min(200, Math.round(t.n)), pass: Math.max(1, Math.min(Math.round(t.pass), Math.round(t.n))) };
  return defaultQuestions(area, student);
}

/** The pass mark as a percentage (scores are saved as percentages). */
export const passPct = (q: QSetting) => Math.round((100 * q.pass) / q.n);
