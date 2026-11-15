"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PROSE_TEAMIM } from "@/data/teamim-reference";
import { TEAMIM_LEVELS } from "@/data/teamim-levels";
import { BEGINNER_LEVELS } from "@/data/beginner";

interface Klass {
  id: string;
  name: string;
  code: string;
  teacher_id: string;
  unlocked_level: number;
  beginner_level: number;
}
interface Member {
  class_id: string;
  student_id: string;
  unlocked_level: number | null;
  beginner_level: number | null;
}
interface Student {
  id: string;
  display_name: string | null;
  username: string | null;
}
interface Row {
  user_id: string;
  kind: "practice" | "quiz";
  key: string;
  best: number;
  right_n: number;
  total_n: number;
  updated_at: string;
}

const NAME = new Map(PROSE_TEAMIM.map((t) => [t.id, t.syrian]));
/** "/audio/teamim/torah/shofar-holekh_segolta.mp3" -> "Shofar Holekh + Segolta" */
function practiceName(key: string) {
  const bw = key.match(/^beginner-words:(\d+):(\w+)$/);
  if (bw) {
    const l = BEGINNER_LEVELS.find((x) => x.n === Number(bw[1]));
    return `Words: ${l && l.n <= 10 ? l.title.replace(/:.*/, "") : "all nekudot"} (${bw[2] === "listen" ? "listen" : "read aloud"})`;
  }
  const file = key.split("/").pop()?.replace(/\.\w+$/, "") ?? key;
  return file
    .split("_")
    .map((id) => NAME.get(id) ?? id)
    .join(" + ");
}

const stars = (s: number) => (s >= 88 ? 3 : s >= 70 ? 2 : s >= 45 ? 1 : 0);

function StudentRow({
  s,
  rows,
  member,
  classLevel,
  onLevel,
  classBeginner,
  onBeginner,
}: {
  s: Student;
  rows: Row[];
  member: Member;
  classLevel: number;
  onLevel: (level: number | null) => void;
  classBeginner: number;
  onBeginner: (level: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const practice = rows.filter((r) => r.kind === "practice");
  const quiz = rows.filter((r) => r.kind === "quiz");
  const twoStars = practice.filter((r) => stars(r.best) >= 2).length;
  const right = quiz.reduce((a, r) => a + r.right_n, 0);
  const total = quiz.reduce((a, r) => a + r.total_n, 0);
  const last = rows.map((r) => r.updated_at).sort().pop();
  const weak = quiz.filter((r) => r.total_n >= 2 && r.right_n / r.total_n < 0.6).map((r) => NAME.get(r.key) ?? r.key);
  return (
    <>
      <tr className="cursor-pointer border-t border-stone-100 hover:bg-amber-50/50" onClick={() => setOpen(!open)}>
        <td className="py-2 pe-3 font-medium text-stone-900">
          {s.display_name || s.username}
          <span className="ms-2 text-xs font-normal text-stone-400">{s.username}</span>
        </td>
        <td className="py-2 pe-3" onClick={(e) => e.stopPropagation()}>
          <select
            className="rounded border border-stone-200 bg-white px-1 py-0.5 text-xs"
            value={member.unlocked_level ?? ""}
            onChange={(e) => onLevel(e.target.value ? Number(e.target.value) : null)}
            aria-label={`Level for ${s.display_name || s.username}`}
          >
            <option value="">Class ({classLevel})</option>
            {TEAMIM_LEVELS.map((l) => (
              <option key={l.n} value={l.n}>
                Level {l.n}
              </option>
            ))}
          </select>
        </td>
        <td className="py-2 pe-3" onClick={(e) => e.stopPropagation()}>
          <select
            className="rounded border border-stone-200 bg-white px-1 py-0.5 text-xs"
            value={member.beginner_level ?? ""}
            onChange={(e) => onBeginner(e.target.value ? Number(e.target.value) : null)}
            aria-label={`Beginner level for ${s.display_name || s.username}`}
          >
            <option value="">Class ({classBeginner})</option>
            {BEGINNER_LEVELS.map((l) => (
              <option key={l.n} value={l.n}>
                Level {l.n}
              </option>
            ))}
          </select>
        </td>
        <td className="py-2 pe-3 tabular-nums">{practice.length}</td>
        <td className="py-2 pe-3 tabular-nums">{twoStars}</td>
        <td className="py-2 pe-3 tabular-nums">{total ? `${Math.round((100 * right) / total)}% (${total})` : "—"}</td>
        <td className="py-2 pe-3 text-xs text-rose-700">{weak.join(", ")}</td>
        <td className="py-2 text-xs text-stone-500">{last ? new Date(last).toLocaleDateString() : "never"}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="bg-stone-50 px-3 py-3">
            {practice.length === 0 ? (
              <p className="text-sm text-stone-500">No practice yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {practice
                  .sort((a, b) => b.best - a.best)
                  .map((r) => (
                    <span key={r.key} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs">
                      {practiceName(r.key)} <span className="text-amber-600">{"★".repeat(stars(r.best)) || "☆"}</span>{" "}
                      <span className="text-stone-400">{r.best}</span>
                    </span>
                  ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** Teachers: make classes (each gets a code for students) and see every child's progress. */
export default function TeacherPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Klass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const db = supabase();
    let q = db.from("classes").select("id, name, code, teacher_id, unlocked_level, beginner_level").order("created_at");
    if (profile.role !== "admin") q = q.eq("teacher_id", profile.id);
    const { data: cls, error } = await q;
    if (error) return setError(error.message);
    setClasses((cls as Klass[]) ?? []);
    const ids = (cls ?? []).map((c) => c.id);
    if (!ids.length) return;
    const { data: mem } = await db.from("class_members").select("class_id, student_id, unlocked_level, beginner_level").in("class_id", ids);
    setMembers((mem as Member[]) ?? []);
    const sids = [...new Set((mem ?? []).map((m) => m.student_id))];
    if (!sids.length) return;
    const [{ data: st }, { data: pr }] = await Promise.all([
      db.from("profiles").select("id, display_name, username").in("id", sids),
      db.from("progress").select("user_id, kind, key, best, right_n, total_n, updated_at").in("user_id", sids),
    ]);
    setStudents((st as Student[]) ?? []);
    setRows((pr as Row[]) ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return <p className="py-24 text-center text-stone-500">This page is for teachers.</p>;
  }

  const setClassLevel = async (id: string, level: number) => {
    setClasses((cs) => cs.map((c) => (c.id === id ? { ...c, unlocked_level: level } : c)));
    const { error } = await supabase().from("classes").update({ unlocked_level: level }).eq("id", id);
    if (error) setError(error.message);
  };

  const setStudentLevel = async (classId: string, studentId: string, level: number | null) => {
    setMembers((ms) =>
      ms.map((m) => (m.class_id === classId && m.student_id === studentId ? { ...m, unlocked_level: level } : m)),
    );
    const { error } = await supabase()
      .from("class_members")
      .update({ unlocked_level: level })
      .eq("class_id", classId)
      .eq("student_id", studentId);
    if (error) setError(error.message);
  };

  const setClassBeginner = async (id: string, level: number) => {
    setClasses((cs) => cs.map((c) => (c.id === id ? { ...c, beginner_level: level } : c)));
    const { error } = await supabase().from("classes").update({ beginner_level: level }).eq("id", id);
    if (error) setError(error.message);
  };

  const setStudentBeginner = async (classId: string, studentId: string, level: number | null) => {
    setMembers((ms) =>
      ms.map((m) => (m.class_id === classId && m.student_id === studentId ? { ...m, beginner_level: level } : m)),
    );
    const { error } = await supabase()
      .from("class_members")
      .update({ beginner_level: level })
      .eq("class_id", classId)
      .eq("student_id", studentId);
    if (error) setError(error.message);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.school_id) {
      setError("Your account isn't linked to a school yet. Enter your school's teacher code first.");
      return;
    }
    const { error } = await supabase()
      .from("classes")
      .insert({ name: name.trim(), school_id: profile.school_id, teacher_id: profile.id });
    if (error) setError(error.message);
    else {
      setName("");
      load();
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-stone-900">My classes</h1>
      <p className="mt-1 text-stone-600">
        Make a class, then give its <b>class code</b> to your students. They go to <b>Create account</b>, choose a username
        and password, and type the code. Choose how many <b>te&apos;amim levels</b> and <b>Beginner Keriah levels</b> are open for each class: children can&apos;t go past them. To move one child ahead or back, change their own level. Click a student to see each ta&apos;am they&apos;ve practised.
      </p>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <form onSubmit={add} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="grow">
          <span className="block text-xs font-medium text-stone-600">New class name (e.g. &quot;Grade 4 – Rabbi Cohen&quot;)</span>
          <input
            className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-amber-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Make class</button>
      </form>

      <div className="mt-6 space-y-5">
        {classes.map((c) => {
          const kids = members
            .filter((m) => m.class_id === c.id)
            .map((m) => students.find((s) => s.id === m.student_id))
            .filter((s): s is Student => Boolean(s))
            .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
          return (
            <section key={c.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-stone-900">{c.name}</h2>
                <label className="text-sm text-stone-600">
                  Levels open:{" "}
                  <select
                    className="ms-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-900"
                    value={c.unlocked_level}
                    onChange={(e) => setClassLevel(c.id, Number(e.target.value))}
                  >
                    {TEAMIM_LEVELS.map((l) => (
                      <option key={l.n} value={l.n}>
                        1{l.n > 1 ? `–${l.n}` : ""} (up to {l.title})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-stone-600">
                  Beginner Keriah:{" "}
                  <select
                    className="ms-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-1 text-sm font-semibold text-sky-900"
                    value={c.beginner_level}
                    onChange={(e) => setClassBeginner(c.id, Number(e.target.value))}
                  >
                    {BEGINNER_LEVELS.map((l) => (
                      <option key={l.n} value={l.n}>
                        1{l.n > 1 ? `–${l.n}` : ""} (up to {l.title})
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-sm text-stone-600">
                  Class code <span className="ms-1 rounded bg-amber-100 px-2 py-0.5 font-mono text-base tracking-widest text-amber-900">{c.code}</span>
                </span>
              </div>
              {kids.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No students yet. Give them the class code.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-stone-400">
                      <tr>
                        <th className="pb-1 pe-3 font-medium">Student</th>
                        <th className="pb-1 pe-3 font-medium">Te&apos;amim</th>
                        <th className="pb-1 pe-3 font-medium">Beginner</th>
                        <th className="pb-1 pe-3 font-medium">Practised</th>
                        <th className="pb-1 pe-3 font-medium">2+ stars</th>
                        <th className="pb-1 pe-3 font-medium">Quiz right</th>
                        <th className="pb-1 pe-3 font-medium">Needs work</th>
                        <th className="pb-1 font-medium">Last active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kids.map((s) => (
                        <StudentRow
                          key={s.id}
                          s={s}
                          rows={rows.filter((r) => r.user_id === s.id)}
                          member={members.find((m) => m.class_id === c.id && m.student_id === s.id)!}
                          classLevel={c.unlocked_level}
                          onLevel={(lvl) => setStudentLevel(c.id, s.id, lvl)}
                          classBeginner={c.beginner_level}
                          onBeginner={(lvl) => setStudentBeginner(c.id, s.id, lvl)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
