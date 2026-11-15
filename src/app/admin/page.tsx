"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { RecordingsPanel } from "@/components/auth/RecordingsPanel";

interface School {
  id: string;
  name: string;
  seats: number;
  paid_until: string | null;
  teacher_code: string;
}
interface Person {
  id: string;
  role: string;
  school_id: string | null;
  display_name: string | null;
  username: string | null;
}

const input = "rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500";
const today = () => new Date().toISOString().slice(0, 10);

/** The owner's page: add schools, set how many seats they paid for and until when. */
export default function AdminPage() {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", seats: "100", paid_until: "" });

  const load = useCallback(async () => {
    const db = supabase();
    const [s, p] = await Promise.all([
      db.from("schools").select("id, name, seats, paid_until, teacher_code").order("name"),
      db.from("profiles").select("id, role, school_id, display_name, username"),
    ]);
    if (s.error || p.error) setError((s.error ?? p.error)!.message);
    setSchools((s.data as School[]) ?? []);
    setPeople((p.data as Person[]) ?? []);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") load();
  }, [profile, load]);

  if (profile?.role !== "admin") {
    return <p className="py-24 text-center text-stone-500">This page is for the site owner.</p>;
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase()
      .from("schools")
      .insert({ name: form.name.trim(), seats: Number(form.seats) || 0, paid_until: form.paid_until || null });
    if (error) setError(error.message);
    else {
      setForm({ name: "", seats: "100", paid_until: "" });
      load();
    }
  };

  const update = async (id: string, patch: Partial<School>) => {
    const { error } = await supabase().from("schools").update(patch).eq("id", id);
    if (error) setError(error.message);
    load();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-stone-900">Admin</h1>
      <p className="mt-1 text-stone-600">
        Add a school when it signs up, then give its <b>teacher code</b> to the teachers. A school&apos;s students can use the
        trainer until the <b>paid until</b> date, up to the number of <b>seats</b> it paid for.
      </p>
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

      <form onSubmit={add} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="grow">
          <span className="block text-xs font-medium text-stone-600">School name</span>
          <input className={`${input} w-full`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Student seats</span>
          <input className={`${input} w-24`} type="number" min={0} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
        </label>
        <label>
          <span className="block text-xs font-medium text-stone-600">Paid until</span>
          <input className={input} type="date" value={form.paid_until} onChange={(e) => setForm({ ...form, paid_until: e.target.value })} />
        </label>
        <button className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">Add school</button>
      </form>

      <div className="mt-6 space-y-4">
        {schools.map((s) => {
          const here = people.filter((p) => p.school_id === s.id);
          const students = here.filter((p) => p.role === "student");
          const teachers = here.filter((p) => p.role === "teacher");
          const active = s.paid_until && s.paid_until >= today();
          return (
            <section key={s.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold text-stone-900">{s.name}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                  {active ? "Active" : "Not active"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-4 text-sm">
                <div>
                  <span className="block text-xs text-stone-500">Teacher code</span>
                  <span className="font-mono text-base tracking-widest text-stone-900">{s.teacher_code}</span>
                </div>
                <label>
                  <span className="block text-xs text-stone-500">Seats ({students.length} used)</span>
                  <input
                    className={`${input} w-24`}
                    type="number"
                    min={0}
                    defaultValue={s.seats}
                    onBlur={(e) => Number(e.target.value) !== s.seats && update(s.id, { seats: Number(e.target.value) })}
                  />
                </label>
                <label>
                  <span className="block text-xs text-stone-500">Paid until</span>
                  <input
                    className={input}
                    type="date"
                    defaultValue={s.paid_until ?? ""}
                    onBlur={(e) => e.target.value !== (s.paid_until ?? "") && update(s.id, { paid_until: e.target.value || null })}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-stone-600">
                <b>Teachers:</b> {teachers.length ? teachers.map((t) => t.display_name || "—").join(", ") : "none yet"}
              </p>
            </section>
          );
        })}
        {schools.length === 0 && <p className="text-stone-500">No schools yet.</p>}
      </div>
      <RecordingsPanel />
    </main>
  );
}
