"use client";

import { useState } from "react";
import { Q_AREAS, defaultQuestions, type QSetting } from "@/lib/question-settings";

/**
 * Teachers: how many questions each Beginner Keriah step asks this class, and how many must be right
 * to finish a level (owner, Nov 20). Empty = the default.
 */
export function QuestionSettings({
  value,
  onSave,
}: {
  value: Record<string, QSetting> | null | undefined;
  onSave: (v: Record<string, QSetting> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Record<string, { n: string; pass: string }>>(() =>
    Object.fromEntries(Q_AREAS.map((a) => [a.id, { n: value?.[a.id]?.n ? String(value[a.id].n) : "", pass: value?.[a.id]?.pass ? String(value[a.id].pass) : "" }])),
  );
  const [msg, setMsg] = useState("");
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-amber-800 underline">
        🔢 Questions per lesson{value && Object.keys(value).length ? " (changed)" : ""}
      </button>
    );
  const save = () => {
    const out: Record<string, QSetting> = {};
    for (const a of Q_AREAS) {
      const n = parseInt(v[a.id].n, 10);
      const p = parseInt(v[a.id].pass, 10);
      if (n > 0) out[a.id] = { n: Math.min(200, n), pass: Math.max(1, Math.min(Number.isFinite(p) && p > 0 ? p : Math.ceil(n * 0.8), n)) };
    }
    onSave(Object.keys(out).length ? out : null);
    setMsg("Saved. Your students see the new numbers next time they open a lesson.");
  };
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm">
      <p className="font-medium text-stone-800">How many questions each lesson asks, and how many must be right to finish it</p>
      <p className="text-xs text-stone-600">Leave a box empty to use the default (shown in grey).</p>
      <table className="mt-2 w-full max-w-xl text-left">
        <thead className="text-xs text-stone-500">
          <tr>
            <th className="py-1 font-medium">Step</th>
            <th className="py-1 font-medium">Questions</th>
            <th className="py-1 font-medium">Right to pass</th>
          </tr>
        </thead>
        <tbody>
          {Q_AREAS.map((a) => {
            const d = defaultQuestions(a.id, true);
            return (
              <tr key={a.id} className="border-t border-amber-100">
                <td className="py-1 pe-2 text-stone-800">{a.title}</td>
                <td className="py-1 pe-2">
                  <input
                    inputMode="numeric"
                    value={v[a.id].n}
                    placeholder={d ? String(d.n) : "auto"}
                    onChange={(e) => setV({ ...v, [a.id]: { ...v[a.id], n: e.target.value.replace(/\D/g, "") } })}
                    className="w-20 rounded border border-stone-300 px-2 py-1"
                  />
                </td>
                <td className="py-1">
                  <input
                    inputMode="numeric"
                    value={v[a.id].pass}
                    placeholder={d ? String(d.pass) : "auto"}
                    onChange={(e) => setV({ ...v, [a.id]: { ...v[a.id], pass: e.target.value.replace(/\D/g, "") } })}
                    className="w-20 rounded border border-stone-300 px-2 py-1"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={save} className="rounded-lg bg-amber-700 px-3 py-1 font-semibold text-white">
          Save
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-stone-500">
          Close
        </button>
      </div>
      {msg && <p className="mt-1 text-emerald-800">{msg}</p>}
    </div>
  );
}
