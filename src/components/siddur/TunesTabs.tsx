"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getEdits, saveEdits, useSiteEdits, type TunesEdits } from "@/lib/site-edits";

interface Row {
  part: string;
  partEn: string;
  partHe: string;
  label: string;
  href: string;
}

/** The admin's editor for the chart: rename or hide any part, add links (to the Tefillah or Pizmonim). */
function Editor({ rows, parts, onDone }: { rows: Row[]; parts: { part: string; partEn: string }[]; onDone: () => void }) {
  const cur = getEdits().tunes ?? {};
  const [t, setT] = useState<TunesEdits>({ hidden: [...(cur.hidden ?? [])], labels: { ...(cur.labels ?? {}) }, extra: [...(cur.extra ?? [])] });
  const [msg, setMsg] = useState("");
  const hidden = new Set(t.hidden);
  async function save() {
    const err = await saveEdits({ ...getEdits(), tunes: t });
    setMsg(err ?? "Saved. Everyone sees the new list now.");
    if (!err) onDone();
  }
  return (
    <div data-no-translate dir="ltr" className="mb-5 space-y-3 rounded-2xl border border-violet-300 bg-violet-50 p-4 text-sm">
      <p className="font-semibold text-violet-900">Edit this list (only you see this)</p>
      {parts.map((pt) => (
        <div key={pt.part} className="rounded-xl bg-white p-3 shadow-sm">
          <p className="mb-2 font-semibold text-stone-800">{pt.partEn}</p>
          {rows
            .filter((r) => r.part === pt.part)
            .map((r) => (
              <div key={r.href} className="mb-1.5 flex flex-wrap items-center gap-2">
                <input
                  dir="rtl"
                  value={t.labels?.[r.href] ?? r.label}
                  onChange={(e) => setT({ ...t, labels: { ...t.labels, [r.href]: e.target.value } })}
                  className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 font-hebrew text-lg"
                />
                <label className="flex items-center gap-1 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={hidden.has(r.href)}
                    onChange={(e) =>
                      setT({ ...t, hidden: e.target.checked ? [...(t.hidden ?? []), r.href] : (t.hidden ?? []).filter((h) => h !== r.href) })
                    }
                  />
                  Hide
                </label>
              </div>
            ))}
        </div>
      ))}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="mb-2 font-semibold text-stone-800">Links you added</p>
        {(t.extra ?? []).map((x, k) => (
          <div key={k} className="mb-1.5 flex flex-wrap items-center gap-2">
            <input
              dir="rtl"
              value={x.label}
              placeholder="Name"
              onChange={(e) => setT({ ...t, extra: t.extra!.map((y, i) => (i === k ? { ...y, label: e.target.value } : y)) })}
              className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 font-hebrew text-lg"
            />
            <input
              value={x.href}
              placeholder="Link, e.g. /siddur/shaharit-shabbat/#p-3-2"
              onChange={(e) => setT({ ...t, extra: t.extra!.map((y, i) => (i === k ? { ...y, href: e.target.value } : y)) })}
              className="w-64 rounded border border-stone-300 px-2 py-1"
            />
            <select
              value={x.part}
              onChange={(e) => setT({ ...t, extra: t.extra!.map((y, i) => (i === k ? { ...y, part: e.target.value } : y)) })}
              className="rounded border border-stone-300 px-2 py-1"
            >
              {parts.map((p) => (
                <option key={p.part} value={p.part}>
                  {p.partEn}
                </option>
              ))}
              <option value="pizmonim">Pizmonim</option>
            </select>
            <button type="button" onClick={() => setT({ ...t, extra: t.extra!.filter((_, i) => i !== k) })} className="text-xs text-red-700">
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setT({ ...t, extra: [...(t.extra ?? []), { label: "", href: "/siddur/", part: parts[0]?.part ?? "pizmonim" }] })}
          className="text-xs text-violet-800 underline"
        >
          + Add a link
        </button>
        <p className="mt-1 text-xs text-stone-500">
          A link to a paragraph looks like /siddur/shaharit-shabbat/#p-3-2 (section 3, paragraph 2 of that part).
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={save} className="rounded-full bg-violet-700 px-4 py-1.5 font-semibold text-white">
          Save
        </button>
        <button type="button" onClick={onDone} className="px-2 text-stone-500">
          Cancel
        </button>
      </div>
      {msg && <p className="text-violet-900">{msg}</p>}
    </div>
  );
}

function Tile({ label, href }: { label: string; href: string }) {
  return (
    <li>
      <Link
        href={href}
        lang="he"
        className="block rounded-xl border-2 border-sky-100 bg-sky-50 px-3 py-2.5 text-center font-hebrew text-xl text-stone-900 hover:border-sky-400"
      >
        {label}
      </Link>
    </li>
  );
}

/** Two tabs: the parts of the Tefillah sung with tunes (straight links), and Pizmonim. */
export function TunesTabs({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<"tefillah" | "pizmonim">("tefillah");
  const [editing, setEditing] = useState(false);
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const t = useSiteEdits().tunes ?? {};
  const hidden = new Set(t.hidden ?? []);
  const parts = [...new Map(rows.map((r) => [r.part, r])).values()];
  const shown = (part: string) => [
    ...rows.filter((r) => r.part === part && !hidden.has(r.href)).map((r) => ({ label: t.labels?.[r.href] || r.label, href: r.href })),
    ...(t.extra ?? []).filter((x) => x.part === part && x.label && x.href),
  ];
  const pizmonim = shown("pizmonim");
  return (
    <div>
      {admin && !editing && (
        <button type="button" onClick={() => setEditing(true)} className="mb-3 text-sm text-violet-800 underline">
          ✏️ Edit this list (rename, hide, add links)
        </button>
      )}
      {admin && editing && <Editor rows={rows} parts={parts} onDone={() => setEditing(false)} />}
      <div role="tablist" className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
        {(
          [
            ["tefillah", "Tefillah", "תְּפִלָּה"],
            ["pizmonim", "Pizmonim", "פִּזְמוֹנִים"],
          ] as const
        ).map(([id, en, he]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2.5 text-lg font-semibold ${tab === id ? "bg-white text-sky-900 shadow" : "text-stone-600"}`}
          >
            {en}{" "}
            <span dir="rtl" lang="he" className="font-hebrew">
              {he}
            </span>
          </button>
        ))}
      </div>
      {tab === "tefillah" ? (
        <div className="space-y-5">
          <p className="text-stone-600">Tap a part to go straight to it in the Siddur, with its tunes in each maqam.</p>
          {parts.map((pt) => {
            const list = shown(pt.part);
            if (!list.length) return null;
            return (
              <section key={pt.part} className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-lg font-semibold text-stone-900">
                  {pt.partEn}
                  <span dir="rtl" lang="he" className="font-hebrew text-xl text-sky-800">
                    {pt.partHe}
                  </span>
                </h2>
                <ul dir="rtl" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {list.map((r) => (
                    <Tile key={r.href} {...r} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : pizmonim.length ? (
        <ul dir="rtl" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {pizmonim.map((r) => (
            <Tile key={r.href} {...r} />
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-4xl" aria-hidden>
            🎶
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-900">Pizmonim are coming soon</p>
          <p className="mt-1 text-stone-600">The Hazzan&apos;s pizmonim, with their words and maqam, will be here.</p>
        </div>
      )}
    </div>
  );
}
