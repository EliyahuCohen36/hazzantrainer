"use client";

import { LETTER_LESSONS, LEARN_PASS, learnKey } from "@/data/letter-lessons";
import { SHEVA_STAGES, shevaStageKey } from "@/data/sheva-stages";
import { WORD_STAGES } from "@/data/beginner-words";
import { NEKUDA_GROUPS } from "@/data/nekuda-groups";
import { TEAMIM_LEVELS } from "@/data/teamim-levels";

interface Row {
  user_id: string;
  kind: "practice" | "quiz";
  key: string;
  best: number;
  right_n: number;
  total_n: number;
}
interface Student {
  id: string;
  display_name: string | null;
  username: string | null;
}

const letterGrade = (p: number) => (p >= 90 ? "A" : p >= 80 ? "B" : p >= 70 ? "C" : p >= 60 ? "D" : "F");

/** Everything a child's work adds up to, graded automatically from their saved scores. */
export function gradeStudent(rows: Row[]) {
  const best = new Map(rows.filter((r) => r.kind === "practice").map((r) => [r.key, r.best]));
  const quiz = rows.filter((r) => r.kind === "quiz");
  const letters = LETTER_LESSONS.filter((l) => (best.get(learnKey(l.id)) ?? 0) >= LEARN_PASS).length;
  // Passed = reached the lesson's pass mark (saved as "<key>:passed"), or 80% from before.
  const ok = (k: string) => (best.get(`${k}:passed`) ?? 0) >= 100 || (best.get(k) ?? 0) >= 80;
  const nekudot = NEKUDA_GROUPS.filter((g) => ok(`beginner-nekudot:${g.id}`)).length;
  const words = WORD_STAGES.filter((s) => ok(`beginner-stage:${s.id}`)).length;
  const rules = SHEVA_STAGES.filter((s) => ok(shevaStageKey(s.id))).length;
  const teamim = TEAMIM_LEVELS.filter((l) => (best.get(`teamim-level:${l.n}`) ?? 0) >= 100).length;
  const scores = [...best.entries()]
    .filter(([k]) => !k.startsWith("teamim-level:") && !k.endsWith(":passed") && !k.startsWith("learned:") && !k.startsWith("graded:"))
    .map(([, v]) => v);
  const right = quiz.reduce((a, r) => a + r.right_n, 0);
  const total = quiz.reduce((a, r) => a + r.total_n, 0);
  const all = [...scores, ...(total ? [Math.round((100 * right) / total)] : [])];
  const average = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : null;
  return {
    letters,
    nekudot,
    words,
    rules,
    teamim,
    average,
    grade: average === null ? "—" : letterGrade(average),
    quiz: total ? Math.round((100 * right) / total) : null,
  };
}

/** The class's grades: every child's finished work and average score, with a CSV download. */
export function Gradebook({ className, kids, rows }: { className: string; kids: Student[]; rows: Row[] }) {
  const data = kids.map((s) => ({ s, g: gradeStudent(rows.filter((r) => r.user_id === s.id)) }));
  const csv = () => {
    const head = ["Student", "Letters learned", "Nekudot groups", "Word steps", "Reading-rule steps", "Te'amim levels", "Quiz right %", "Average %", "Grade"];
    const lines = data.map(({ s, g }) =>
      [s.display_name || s.username || "", g.letters, g.nekudot, g.words, g.rules, g.teamim, g.quiz ?? "", g.average ?? "", g.grade]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${className} grades.csv`;
    a.click();
  };
  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600">
          Graded automatically from the children&apos;s practice: nothing to mark by hand. The average is of all their best
          scores and quiz answers.
        </p>
        <button type="button" onClick={csv} className="rounded-lg border border-amber-600 bg-white px-3 py-1.5 text-sm font-semibold text-amber-800">
          ⬇ Download grades (CSV)
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-stone-400">
            <tr>
              <th className="pb-1 pe-3 font-medium">Student</th>
              <th className="pb-1 pe-3 font-medium">Letters</th>
              <th className="pb-1 pe-3 font-medium">Nekudot</th>
              <th className="pb-1 pe-3 font-medium">Words</th>
              <th className="pb-1 pe-3 font-medium">Reading rules</th>
              <th className="pb-1 pe-3 font-medium">Te&apos;amim</th>
              <th className="pb-1 pe-3 font-medium">Average</th>
              <th className="pb-1 font-medium">Grade</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ s, g }) => (
              <tr key={s.id} className="border-t border-stone-200">
                <td className="py-1.5 pe-3 font-medium text-stone-900">{s.display_name || s.username}</td>
                <td className="py-1.5 pe-3 tabular-nums">
                  {g.letters}/{LETTER_LESSONS.length}
                </td>
                <td className="py-1.5 pe-3 tabular-nums">
                  {g.nekudot}/{NEKUDA_GROUPS.length}
                </td>
                <td className="py-1.5 pe-3 tabular-nums">
                  {g.words}/{WORD_STAGES.length}
                </td>
                <td className="py-1.5 pe-3 tabular-nums">
                  {g.rules}/{SHEVA_STAGES.length}
                </td>
                <td className="py-1.5 pe-3 tabular-nums">
                  {g.teamim}/{TEAMIM_LEVELS.length}
                </td>
                <td className="py-1.5 pe-3 tabular-nums">{g.average === null ? "—" : `${g.average}%`}</td>
                <td className="py-1.5 font-semibold">{g.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
