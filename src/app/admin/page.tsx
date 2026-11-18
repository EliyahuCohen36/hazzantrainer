"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { RecordingsPanel } from "@/components/auth/RecordingsPanel";
import { TanakhRecordingsPanel } from "@/components/auth/TanakhRecordingsPanel";

interface School {
  id: string;
  name: string;
  seats: number;
  paid_until: string | null;
  teacher_code: string;
  domain?: string | null;
}
interface Person {
  id: string;
  role: string;
  school_id: string | null;
  display_name: string | null;
  username: string | null;
}

interface FreePerson {
  id: string;
  email: string;
  display_name: string | null;
  paid_until: string | null;
}

const input = "rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-amber-500";
const today = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** The owner's page: add schools, set how many seats they paid for and until when. */
export default function AdminPage() {
  const { profile } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", seats: "100", paid_until: "" });
  const [free, setFree] = useState<FreePerson[]>([]);
  const [freeForm, setFreeForm] = useState({ email: "", until: "" });

  const load = useCallback(async () => {
    const db = supabase();
    const [s, p] = await Promise.all([
      db.from("schools").select("id, name, seats, paid_until, teacher_code, domain").order("name"),
      db.from("profiles").select("id, role, school_id, display_name, username"),
    ]);
    let sd = s.data as School[] | null;
    if (s.error) {
      // Before supabase/accounts.sql is run there's no domain column.
      const old = await db.from("schools").select("id, name, seats, paid_until, teacher_code").order("name");
      sd = (old.data as School[]) ?? [];
    }
    if (p.error) setError(p.error.message);
    setSchools(sd ?? []);
    const f = await db.rpc("admin_free_list");
    setFree((f.data as FreePerson[]) ?? []);
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

  const changeCode = async (sc: School) => {
    const code = window.prompt("New school code (at least 4 letters or numbers):", sc.teacher_code);
    if (!code || code.toUpperCase() === sc.teacher_code) return;
    const { error } = await supabase().rpc("set_school_code", { p_school: sc.id, p_code: code });
    if (error) setError(error.message);
    load();
  };

  const grantFree = async (e: React.FormEvent, until: string | null = freeForm.until || "2099-12-31", email = freeForm.email) => {
    e.preventDefault();
    const { error } = await supabase().rpc("admin_grant_free", { p_email: email, p_until: until });
    if (error) setError(error.message);
    else {
      setFreeForm({ email: "", until: "" });
      load();
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-semibold text-stone-900">Admin</h1>
      <p className="mt-1 text-stone-600">
        Add a school when it signs up, then give its <b>school code</b> to the teachers. If the school uses Google accounts,
        type its <b>email domain</b>: students who sign in with a school Google account join the school by themselves, and
        their teacher puts them in a class. A school&apos;s students can use the
        trainer until the <b>paid until</b> date, up to the number of <b>seats</b> it paid for. A school is
        <b>Off</b> when that date has passed or is empty: use its switch to turn it on (for a year) or off.
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
                {/* On / off: a school can use the site while its "paid until" date hasn't passed. */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!active}
                  onClick={() => {
                    if (active) update(s.id, { paid_until: daysFromToday(-1) });
                    else update(s.id, { paid_until: daysFromToday(365) });
                  }}
                  className="flex items-center gap-2 text-sm font-semibold"
                  title={active ? "Turn off: the school's teachers and students can't use the site" : "Turn on for one year (you can change the date)"}
                >
                  <span className={active ? "text-emerald-800" : "text-rose-800"}>{active ? "On" : "Off"}</span>
                  <span className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-emerald-600" : "bg-stone-300"}`}>
                    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${active ? "left-[1.375rem]" : "left-0.5"}`} />
                  </span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-4 text-sm">
                <div>
                  <span className="block text-xs text-stone-500">School code (for teachers)</span>
                  <span className="font-mono text-base tracking-widest text-stone-900">{s.teacher_code}</span>
                  <button type="button" onClick={() => changeCode(s)} className="ms-2 text-xs text-amber-800 underline">
                    Change
                  </button>
                </div>
                <label>
                  <span className="block text-xs text-stone-500">School email domain (Google sign-in)</span>
                  <input
                    className={`${input} w-44`}
                    placeholder="e.g. barkai.org"
                    defaultValue={s.domain ?? ""}
                    onBlur={(e) => {
                      const d = e.target.value.trim().toLowerCase().replace(/^@/, "") || null;
                      if (d !== (s.domain ?? null)) update(s.id, { domain: d });
                    }}
                  />
                </label>
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
                    key={s.paid_until ?? "none"}
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
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
        <h2 className="text-lg font-semibold text-stone-900">Free access (family and friends)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Let someone use everything for free while you test. They sign in once first (with Google, or Subscribe → create an
          account), then enter their email here. They learn at their own pace, like a personal subscriber.
        </p>
        <form onSubmit={(e) => grantFree(e)} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grow">
            <span className="block text-xs font-medium text-stone-600">Their email</span>
            <input className={`${input} w-full`} type="email" value={freeForm.email} onChange={(e) => setFreeForm({ ...freeForm, email: e.target.value })} required />
          </label>
          <label>
            <span className="block text-xs font-medium text-stone-600">Free until (empty = no end)</span>
            <input className={input} type="date" value={freeForm.until} onChange={(e) => setFreeForm({ ...freeForm, until: e.target.value })} />
          </label>
          <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Give free access</button>
        </form>
        {free.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {free.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{f.display_name || f.email}</span>
                <span className="text-stone-500">{f.email}</span>
                <span className="text-stone-500">until {f.paid_until === "2099-12-31" ? "no end" : f.paid_until}</span>
                <button type="button" onClick={(e) => grantFree(e as unknown as React.FormEvent, null, f.email)} className="text-xs text-rose-700 underline">
                  Stop free access
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <RecordingsPanel />
      <TanakhRecordingsPanel />
    </main>
  );
}
