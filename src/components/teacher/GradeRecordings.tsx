"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Row {
  id: string;
  student: string;
  tune: string;
  src: string;
  label: string;
  level: number | null;
  path: string;
  created_at: string;
  grade: number | null;
}

/** One child's recording: play it (and the Hazzan's), then give a grade 1–10. */
function Item({ r, onGraded }: { r: Row; onGraded: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    supabase()
      .storage.from("submissions")
      .createSignedUrl(r.path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [r.path]);
  async function grade(g: number) {
    setBusy(true);
    const { data, error } = await supabase().rpc("grade_submission", { p_id: r.id, p_grade: g });
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg(data === "level-up" ? `Saved: ${g}/10. The next level opened for this child.` : `Saved: ${g}/10.`);
    onGraded();
  }
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-stone-900">{r.student}</span>
        <span className="text-sm text-stone-600">
          {r.label}
          {r.level ? ` · Level ${r.level}` : ""}
          {r.tune !== "torah" ? ` · ${r.tune}` : ""} · {new Date(r.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {url ? <audio src={url} controls className="h-9 max-w-xs" /> : <span className="text-xs text-stone-500">Loading…</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Grade">
        <span className="me-1 text-sm text-stone-600">Grade:</span>
        {Array.from({ length: 10 }, (_, k) => k + 1).map((g) => (
          <button
            key={g}
            type="button"
            disabled={busy}
            onClick={() => grade(g)}
            className={`size-9 rounded-full text-sm font-semibold ring-1 ${
              r.grade === g
                ? "bg-amber-700 text-white ring-amber-700"
                : g >= 7
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-300 hover:bg-emerald-100"
                  : "bg-white text-stone-700 ring-stone-300 hover:bg-stone-50"
            }`}
          >
            {g}
          </button>
        ))}
        <span className="ms-2 text-xs text-stone-500">7 or more passes</span>
      </div>
      {msg && <p className="mt-1 text-sm text-emerald-800">{msg}</p>}
    </li>
  );
}

/**
 * Teachers: the te'amim your students recorded for you. A grade of 7 or more passes the ta'am,
 * and when a level is all passed the child's next level opens (supabase/submissions.sql).
 */
export function GradeRecordings() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [showGraded, setShowGraded] = useState(false);
  const load = useCallback(() => {
    supabase()
      .rpc("teacher_submissions")
      .then(({ data, error }) => {
        if (error) setMissing(true);
        setRows((data as Row[]) ?? []);
      });
  }, []);
  useEffect(load, [load]);
  if (rows === null) return null;
  const waiting = rows.filter((r) => r.grade === null);
  const graded = rows.filter((r) => r.grade !== null);
  return (
    <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
      <h2 className="text-lg font-semibold text-stone-900">Te&apos;amim to grade 🎙</h2>
      {missing ? (
        <p className="mt-1 text-sm text-stone-600">Ask the site owner to run supabase/submissions.sql first.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-stone-600">
            Your students record each ta&apos;am for you. Give a grade from 1 to 10: 7 or more passes, and when every ta&apos;am of a
            level has passed, the child&apos;s next level opens by itself.
          </p>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-stone-700">Nothing waiting right now.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {waiting.map((r) => (
                <Item key={r.id} r={r} onGraded={load} />
              ))}
            </ul>
          )}
          {graded.length > 0 && (
            <button type="button" onClick={() => setShowGraded((x) => !x)} className="mt-3 text-sm text-sky-900 underline">
              {showGraded ? "Hide graded recordings" : `Graded recordings (${graded.length})`}
            </button>
          )}
          {showGraded && (
            <ul className="mt-2 space-y-2">
              {graded.map((r) => (
                <Item key={r.id} r={r} onGraded={load} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
