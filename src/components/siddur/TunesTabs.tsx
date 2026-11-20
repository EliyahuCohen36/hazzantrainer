"use client";

import { useState } from "react";
import Link from "next/link";

interface Row {
  part: string;
  partEn: string;
  partHe: string;
  label: string;
  href: string;
}

/** Two tabs: the parts of the Tefillah sung with tunes (straight links), and Pizmonim. */
export function TunesTabs({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<"tefillah" | "pizmonim">("tefillah");
  const parts = [...new Map(rows.map((r) => [r.part, r])).values()];
  return (
    <div>
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
          {parts.map((pt) => (
            <section key={pt.part} className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-lg font-semibold text-stone-900">
                {pt.partEn}
                <span dir="rtl" lang="he" className="font-hebrew text-xl text-sky-800">
                  {pt.partHe}
                </span>
              </h2>
              <ul dir="rtl" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rows
                  .filter((r) => r.part === pt.part)
                  .map((r) => (
                    <li key={r.href}>
                      <Link
                        href={r.href}
                        lang="he"
                        className="block rounded-xl border-2 border-sky-100 bg-sky-50 px-3 py-2.5 text-center font-hebrew text-xl text-stone-900 hover:border-sky-400"
                      >
                        {r.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
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
